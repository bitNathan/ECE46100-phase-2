import express from 'express';
import { processPackage } from '../utils/packageProcessor';
import { ratePackage } from '../utils/ratePackage';
import { extractNameAndVersionFromURL, getOwnerAndRepoFromURL, resolveURL } from '../utils/handleURL';
import { generateID } from '../utils/generateID';
import axios from 'axios';
import dbConnectionPromise from './db';
import isBase64 from 'is-base64';
import AdmZip from 'adm-zip';
import { parseURL } from '../url_parse';

const router = express.Router();

// Route to handle package upload/ingest
router.post('/package', async (req, res) => {
  try {
    const {
      Name,
      Version,
      Content,
      URL,
      debloat = false,
      JSProgram = '',
    } = req.body;

    if ((Content && URL) || (!Content && !URL)) {
      res.status(400).json({
        message: 'Either Content or URL must be provided, but not both' });
      return;
    }

    if (Content && !Name) {
      res.status(400).json({ message: 'Name is required for Content' });
      return;
    }

    let packageBuffer: Buffer | null = null;
    let packageName = Name;
    let packageVersion = Version;
    let readmeContent: string | null = null; 

    // Establish db connection
    const db_connection = await dbConnectionPromise; 

    // check db connection status
    if (!db_connection) {
      res.status(500).json({ message: 'Database connection failed' });
      return;
    }
   
    let owner = '';
    let repo = '';

    if (Content) {

      // Validate Base64 Content
      if (!isBase64(Content, { allowEmpty: false })) {
        res.status(400).json({ message: 'Invalid Base64 Content' });
        return;
      }
    
      // Decode Base64 Content
      try {
        packageBuffer = Buffer.from(Content, 'base64');
      } catch (error) {
        res.status(400).json({ message: 'Invalid Base64 Content' });
        return;
      }

      // Extract README file content
      try {
        const zip = new AdmZip(packageBuffer); // Initialize zip handler

        // List of possible README file names to check
        const readmeCandidates = ['README.md', 'Readme.md', 'readme.md', 'readme.txt', 'README.txt', 'Readme.txt', 'README', 'Readme', 'readme'];
        const readmeEntry = readmeCandidates
          .map((candidate) =>
            zip.getEntries().find((entry) => entry.entryName.endsWith(candidate))
          )
          .find((entry) => entry); // Stop at the first match

        if (readmeEntry) {
          readmeContent = readmeEntry.getData().toString('utf-8'); // Extract README content
        } else {
          //console.warn('No README.md, Readme.md, or readme.md file found in the uploaded content');
        }
      } catch (error) {
        //console.warn('Cannot read README.md from content:', error);
      }

      // get owner repo from content
      try {

        // Initialize zip handler
        const zip = new AdmZip(packageBuffer);

        // Search for package.json in the zip file
        const zipEntries = zip.getEntries();
        let packageJsonContent = null;

        zipEntries.forEach((entry) => {
          if (entry.entryName.endsWith('package.json')) {
            packageJsonContent = entry.getData().toString('utf8');
          }
        });        

        if (!packageJsonContent) {
          throw new Error("package.json not found in the uploaded content.");
        }

        // Parse the package.json content
        const packageJson = JSON.parse(packageJsonContent);

        // Extract the repository field
        const repository = packageJson.repository;

        // Handle different formats of the repository field
        let url = null;
        if (typeof repository === 'string') {
          // Direct string format like "bendrucker/smallest"
          url = `https://github.com/${repository}`;
        } else if (typeof repository === 'object' && repository.url) {
          // Object format with a URL field
          url = repository.url;
        }

        if (!url) {
          console.error('Error extracting package.json:');
          res.status(400).json({ message: 'Error fetching URL from Package' });
          return;
        }

        // Parse the URL (if needed to get specific parts like owner and repo)
        [owner, repo] = await parseURL(url);

      } catch (error) {
        console.error('Error extracting package.json:', error);
        res.status(400).json({ message: 'Error fetching URL from Package' });
        return;
      }

    } else if (URL) {
      // Fetch package from URL
      try {
        // Fetch the package buffer
        const resolvedURL = await resolveURL(URL);
        const ownerRepo = await getOwnerAndRepoFromURL(resolvedURL);
        owner = ownerRepo.owner;
        repo = ownerRepo.repo;
        console.log(owner, repo);

        const repoInfoUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const repoInfoResponse = await axios.get(repoInfoUrl);
        const branch = repoInfoResponse.data.default_branch;

        let axiosResponse = null;

        // Fetch the package zip archive
        try {
          const githubZipUrl = `https://github.com/${owner}/${repo}/archive/${branch}.zip`;
          axiosResponse = await axios.get(githubZipUrl, {
            responseType: 'arraybuffer',
          });
        } catch (error) {
          res.status(400).json({ message: 'Error fetching package from URL' });
          return;
        }

        // Convert the zip archive to a buffer
        packageBuffer = Buffer.from(axiosResponse.data);

        // Fetch README file
        let readmeResponse = null;
        const readmeCandidates = ['README.md', 'Readme.md', 'readme.md', 'readme.txt', 'README.txt', 'Readme.txt', 'README', 'Readme', 'readme'];
        for (const candidate of readmeCandidates) {
          try {
            const readmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${candidate}`;
            readmeResponse = await axios.get(readmeUrl);
            if (readmeResponse && readmeResponse.status === 200) {
              readmeContent = readmeResponse.data;
              break; // Stop once we find a valid README
            }
          } catch (error) {
            // Ignore errors and try the next candidate
          }
        }

        if (!readmeContent) {
          console.warn('No README file found in the repository root');
        }

        // Copy the version and Name from the URL
        if (!Name || !Version) {
          const { extractedName, extractedVersion } = await extractNameAndVersionFromURL(URL);
          packageName = extractedName || packageName;
          packageVersion = extractedVersion || packageVersion;
        }
      } catch (error) {
        res.status(400).json({ message: 'Error fetching package from URL' });
        return;
      }
    }

    if (!packageBuffer) {
      res.status(400).json({ message: 'Failed to obtain package buffer' });
      return;
    }

    // default version to 1.0.0 if not provided
    if (!packageVersion) {
      packageVersion = '1.0.0';
    }

    // Handle debloat if required
    if (debloat === true) {
      let newPackageBuffer = null;
      try {
        newPackageBuffer = await processPackage(packageBuffer);
        packageBuffer = newPackageBuffer;
      } catch (error) {
        console.error('Error during debloating:', error);
      }
    }

    // Rate the package
    console.log('Rating package:', owner, repo);
    const ratings: number[] = await ratePackage(owner, repo);
    console.log('Ratings:', ratings);
    for (const rating of ratings) {
      if (rating < 0.5) {
        res.status(424).json({
          message: 'Package is not uploaded due to the disqualified rating.',
        });
        return;
      }
    }

    // Generate ID
    const packageID = generateID(packageName, packageVersion);

    // Check if package already exists
    try {
      const [existing] = await db_connection.execute(
        'SELECT id FROM packages WHERE id = ?',
        [packageID]
      );

      if (Array.isArray(existing) && existing.length > 0) {
        res.status(409).json({ message: 'Package already exists.' });
        return;
      }
    } catch (error) {
      console.error('Error checking package existence:', error);
      res.status(500).json({ message: 'Server error' });
      return;
    }

    // Insert into database
    try {
      await db_connection.execute(
        'INSERT INTO packages (id, package_name, package_version, content, url, js_program, debloat, readme) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          packageID,
          packageName,
          packageVersion,
          packageBuffer,
          URL || null,
          JSProgram || null,
          debloat,
          readmeContent || null
        ]
      );
    } catch (error) {
      console.error('Error inserting package:', error);
      res.status(500).json({ message: 'Server error during upload' });
      return;
    }
    
    // Build the response object
    const response = {
      metadata: {
        Name: packageName,
        Version: packageVersion,
        ID: packageID,
      },
      data: {
        ...(packageBuffer ? { Content: packageBuffer.toString('base64') } : {}),
        ...(URL ? { URL: URL } : {}),
        JSProgram,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error uploading package:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Server error'
    });
  }
});

export default router;
