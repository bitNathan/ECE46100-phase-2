import express from 'express';
import { processPackage } from '../utils/packageProcessor';
import { ratePackage } from '../utils/ratePackage';
import { extractNameAndVersionFromURL, getOwnerAndRepoFromURL, resolveURL } from '../utils/handleURL';
import { generateID } from '../utils/generateID';
import axios from 'axios';
import dbConnectionPromise from './db';
import isBase64 from 'is-base64';
import AdmZip from 'adm-zip';
import { read } from 'fs';

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
        const readmeEntry = zip.getEntries().find((entry) => 
          entry.entryName.toLowerCase().endsWith('readme.md') // Look for README files
        );
    
        if (readmeEntry) {
          readmeContent = readmeEntry.getData().toString('utf-8'); // Extract README content
        } else {
          console.warn('No README.md file found in the uploaded content');
        }
      } catch (error) {
        console.warn('Error reading README.md from content:', error);
      }
    } else if (URL) {
      // Fetch package from URL
      try {
        // Fetch the package buffer
        const resolvedURL = await resolveURL(URL);
        const {owner, repo} = await getOwnerAndRepoFromURL(resolvedURL);

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
        try {
          const readmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;
          readmeResponse = await axios.get(readmeUrl);
          if (readmeResponse && readmeResponse.status === 200) {
            readmeContent = readmeResponse.data;
          } else {
            console.warn('README.md not found in the repository root');
          }
        } catch (error) { // try readme.md
          try {
            const readmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/readme.md`;
            readmeResponse = await axios.get(readmeUrl);
            if (readmeResponse && readmeResponse.status === 200) {
              readmeContent = readmeResponse.data;
            } else {
              console.warn('README.md not found in the repository root');
            }
          } catch (error) {
            console.warn('Error fetching README.md:', error);
          }
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
      packageBuffer = await processPackage(packageBuffer);
    }

    // Rate the package
    const rating = await ratePackage(packageBuffer);
    if (rating < 0.5) {
      res.status(424).json({
        message: 'Package is not uploaded due to the disqualified rating.',
      });
      return;
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
