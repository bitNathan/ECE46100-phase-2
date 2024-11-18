import express from 'express';
import { processPackage } from '../utils/packageProcessor';
import { ratePackage } from '../utils/ratePackage';
import { extractNameAndVersionFromURL } from '../utils/handleURL';
import { generateID } from '../utils/generateID';
import axios from 'axios';

const mysql = require('mysql2/promise');
const router = express.Router();

// Database Configuration
let db_connection = mysql.Connection;
(async () => {
  try {
    db_connection = await mysql.createConnection({
      host: process.env.AWS_RDS_ENDPOINT,
      user: process.env.AWS_RDS_USERNAME,
      password: process.env.AWS_RDS_PASSWORD,
      database: process.env.AWS_RDS_DATABASE_NAME,
      port: parseInt(process.env.AWS_RDS_PORT as string, 10)
    });
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
})();

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

    if (Content) {
      // Decode Base64 Content
      try {
        packageBuffer = Buffer.from(Content, 'base64');
      } catch (error) {
        res.status(400).json({ message: 'Invalid Base64 Content' });
        return;
      }
    } else if (URL) {
      // Fetch package from URL
      try {
        // Copy the version and Name from the URL
        if (!Name || !Version) {
          const { extractedName, extractedVersion } = await extractNameAndVersionFromURL(URL);
          packageName = extractedName || packageName;
          packageVersion = extractedVersion || packageVersion;
        }

        // Fetch the package buffer
        const axiosResponse = await axios.get(URL, {
          responseType: 'arraybuffer',
        });
        packageBuffer = Buffer.from(axiosResponse.data);
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
        'INSERT INTO packages (id, package_name, package_version, content, url, js_program, debloat) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          packageID,
          packageName,
          packageVersion,
          packageBuffer,
          URL || null,
          JSProgram || null,
          debloat
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
        ...(Content ? { Content: packageBuffer.toString('base64') } : {}),
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

// download package
router.get('/package/:id', async (req, res) => {
  try {
    const packageID = req.params.id;
    console.log('Package ID:', packageID);

    // Check if packageID is provided
    if (!packageID) {
      res.status(400).json({ message: 'Package ID is required' });
      return;
    }

    // Fetch the package from the database
    const [rows] = await db_connection.execute(
      'SELECT package_name, package_version, content, url, js_program FROM packages WHERE id = ?',
      [packageID]
    );

    if (Array.isArray(rows) && rows.length === 0) {
      res.status(404).json({ message: 'Package does not exist.' });
      return;
    }

    const packageData = rows[0];

    // Build the response object
    const response = {
      metadata: {
        Name: packageData.package_name,
        Version: packageData.package_version,
        ID: packageID,
      },
      data: {
        Content: packageData.content.toString('base64'),
        ...(packageData.url ? { URL: packageData.url } : {}),
        JSProgram: packageData.js_program,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Server error',
    });
  }
});

export default router;