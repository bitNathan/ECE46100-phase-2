import express from 'express';
import axios from 'axios';
import semver from 'semver';
import dbConnectionPromise from './db';
import { processPackage } from '../utils/packageProcessor';
import { ratePackage } from '../utils/ratePackage';
import { extractNameAndVersionFromURL, getOwnerAndRepoFromURL, resolveURL } from '../utils/handleURL';
import { generateID } from '../utils/generateID';
import isBase64 from 'is-base64';

const router = express.Router();

/**
 * POST /package/{id}
 * 
 * This endpoint updates an existing package by uploading a new version.
 * The {id} in the path refers to an existing package version, which helps identify
 * the specific package (and name) we are updating.
 * 
 * Requirements:
 * - Check if the package exists using the provided {id}.
 * - Validate that the provided metadata name matches the existing package name.
 * - Check ingestion method consistency (Content or URL).
 * - Validate version and ensure it doesn't already exist.
 * - For Content ingestion:
 *   * Major/Minor in any order allowed.
 *   * Patch must be strictly greater than all existing patches for that Major.Minor pair.
 * - For URL ingestion:
 *   * Older patch versions are allowed. Just ensure the exact version does not already exist.
 * - If rating < 0.5, return 424.
 * - If version already exists, return 409.
 * - If package does not exist, return 404.
 * - If invalid input, return 400.
 * - If successful, return 200 with the updated package details.
 */

router.post('/package/:id', async (req, res) => {
  try {
    const packageID = req.params.id;
    const { metadata, data } = req.body;

    // Basic request validation
    if (!metadata || !data || !metadata.Name || !metadata.Version || !metadata.ID) {
      res.status(400).json({ message: 'Missing required fields in metadata or data' });
      return;
    }

    const { Name, Version, ID } = metadata;
    const { Content, URL, JSProgram = '', debloat = false } = data;

    // Check that the path param ID and metadata ID refer to the same package lineage
    // The path ID is the older version. The metadata.ID may be different since it's the new version's ID,
    // but we should ensure it matches the same package name lineage.
    // Actually, per instructions, the given {id} in the path helps identify the package. We'll use that to find the original package.
    // We'll then confirm the Name matches.

    const db_connection = await dbConnectionPromise;
    if (!db_connection) {
      res.status(500).json({ message: 'Database connection failed' });
      return;
    }

    // Retrieve the existing package by the provided {id}
    const [existingRows] = await db_connection.execute(
      'SELECT package_name, package_version, url, debloat FROM packages WHERE id = ?',
      [packageID]
    );

    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      res.status(404).json({ message: 'Package does not exist.' });
      return;
    }

    const existingPackage = existingRows[0];
    const originalName = existingPackage.package_name;
    const originalURL = existingPackage.url; // if null => content ingestion, if not null => URL ingestion

    // Check name match
    if (Name !== originalName) {
      res.status(400).json({ message: 'Name in metadata does not match the existing package name.' });
      return;
    }

    // Check ingestion method consistency
    const isOriginalFromContent = !originalURL;
    const isUpdateFromContent = !!Content;
    const isUpdateFromURL = !!URL;

    if (isOriginalFromContent && isUpdateFromURL) {
      res.status(400).json({ message: 'Package was originally ingested via Content, must be updated via Content only.' });
      return;
    }
    if (!isOriginalFromContent && isUpdateFromContent) {
      res.status(400).json({ message: 'Package was originally ingested via URL, must be updated via URL only.' });
      return;
    }

    // Validate version string
    if (!semver.valid(Version)) {
      res.status(400).json({ message: 'Invalid version format. Must be valid semver.' });
      return;
    }

    // The unique ID for the new version:
    const newPackageID = generateID(Name, Version);

    // Check if this version already exists
    const [existingVersionCheck] = await db_connection.execute(
      'SELECT id FROM packages WHERE id = ?',
      [newPackageID]
    );

    if (Array.isArray(existingVersionCheck) && existingVersionCheck.length > 0) {
      // This exact version already exists
      res.status(409).json({ message: 'This package version already exists.' });
      return;
    }

    // We need to enforce versioning rules:
    // 1. Fetch all existing versions for this package name
    const [allVersionsRows] = await db_connection.execute(
      'SELECT package_version FROM packages WHERE package_name = ?',
      [Name]
    );

    const allExistingVersions = (allVersionsRows as {package_version: string}[]).map(row => row.package_version);

    // Parse the requested version
    const newSemVer = semver.parse(Version);
    if (!newSemVer) {
      res.status(400).json({ message: 'Invalid version format.' });
      return;
    }

    // Check versioning logic:
    // For content ingestion:
    //   Major/Minor in any order is allowed, but patch versions must be strictly greater than all existing patches for that major.minor.
    // For URL ingestion:
    //   We allow older patch versions. Just ensure that the exact version does not exist (already checked above).
    //
    // Implementation detail:
    // We'll group existing versions by major.minor, find their patches.
    // For content ingestion:
    //   If we find any existing version with the same major.minor, the new patch must be greater than ANY patch that exists for that major.minor.
    // For URL ingestion:
    //   No patch ordering constraints needed.
    
    if (isOriginalFromContent) {
      // Content ingestion: enforce patch ordering
      // Find all patches for the same major.minor
      const sameMajorMinorVersions = allExistingVersions.filter(v => {
        const parsed = semver.parse(v);
        return parsed && parsed.major === newSemVer.major && parsed.minor === newSemVer.minor;
      });

      // Extract their patches
      const existingPatches = sameMajorMinorVersions
        .map(v => (semver.parse(v)?.patch ?? 0))
        .sort((a, b) => a - b);

      // If there are already patches for this major.minor, ensure new patch is greater than all of them
      if (existingPatches.length > 0) {
        const maxPatch = existingPatches[existingPatches.length - 1];
        if (newSemVer.patch <= maxPatch) {
          res.status(400).json({ message: 'Patch version must be strictly greater than all existing patches for this major.minor.' });
          return;
        }
      }
    } 
    // If URL ingestion: no patch ordering checks required beyond existence check.

    // Now fetch the actual package buffer from Content or URL
    let packageBuffer: Buffer | null = null;
    let readmeContent: string | null = null;

    if (isUpdateFromContent) {
      // Validate Base64
      if (!Content || !isBase64(Content, { allowEmpty: false })) {
        res.status(400).json({ message: 'Invalid Base64 Content' });
        return;
      }
      try {
        packageBuffer = Buffer.from(Content, 'base64');
      } catch (error) {
        res.status(400).json({ message: 'Invalid Base64 Content decoding error' });
        return;
      }
    } else if (isUpdateFromURL) {
      // Fetch package from URL
      try {
        const resolvedURL = await resolveURL(URL);
        const {owner, repo} = await getOwnerAndRepoFromURL(resolvedURL);

        const repoInfoUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const repoInfoResponse = await axios.get(repoInfoUrl);
        const branch = repoInfoResponse.data.default_branch;

        let axiosResponse = null;
        // Fetch zip archive
        const githubZipUrl = `https://github.com/${owner}/${repo}/archive/${branch}.zip`;
        axiosResponse = await axios.get(githubZipUrl, { responseType: 'arraybuffer' });
        packageBuffer = Buffer.from(axiosResponse.data);

        // Attempt to fetch README
        try {
          const readmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;
          const readmeResponse = await axios.get(readmeUrl);
          if (readmeResponse && readmeResponse.status === 200) {
            readmeContent = readmeResponse.data;
          }
        } catch {
          // try lowercase readme.md
          try {
            const readmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/readme.md`;
            const readmeResponse = await axios.get(readmeUrl);
            if (readmeResponse && readmeResponse.status === 200) {
              readmeContent = readmeResponse.data;
            }
          } catch {
            // no readme found
          }
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

    // If debloat requested
    if (debloat === true) {
      packageBuffer = await processPackage(packageBuffer);
    }

    // Rate the package
    const rating = await ratePackage(packageBuffer);
    if (rating < 0.5) {
      res.status(424).json({ message: 'Package is not uploaded due to the disqualified rating.' });
      return;
    }

    // Insert the new version into the database
    try {
      await db_connection.execute(
        'INSERT INTO packages (id, package_name, package_version, content, url, js_program, debloat, readme) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          newPackageID,
          Name,
          Version,
          packageBuffer,
          URL || null,
          JSProgram || null,
          debloat,
          readmeContent || null
        ]
      );
    } catch (error) {
      console.error('Error inserting new version:', error);
      res.status(500).json({ message: 'Server error during version update' });
      return;
    }

    // Build the response object, returning 200 per specification
    const response = {
      metadata: {
        Name: Name,
        Version: Version,
        ID: newPackageID,
      },
      data: {
        ...(packageBuffer ? { Content: packageBuffer.toString('base64') } : {}),
        ...(URL ? { URL } : {}),
        JSProgram,
      },
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error updating package version:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Server error'
    });
    return;
  }
});

export default router;