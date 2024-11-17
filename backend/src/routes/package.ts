import express from 'express';
import { processPackage } from '../utils/packageProcessor';
import { ratePackage } from '../utils/ratePackage';
import { savePackageMetadata } from '../utils/packageMetadata';
import { extractNameAndVersionFromURL } from '../utils/handleURL';


import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import crypto from 'crypto';
import dbConnectionPromise from './db';


const router = express.Router();

// AWS Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

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
        message: 'Either Content or URL must be provided, but not both',
      });
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
        // Copy the version and Name from the URL.
        if (!Name || !Version) {
          const {extractedName, extractedVersion} = await extractNameAndVersionFromURL(URL);
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

    /*
    // IF USING INTERNAL AUTHENTICATION
    // Authentication middleware
    app.use((req, res, next) => {
      const token = req.headers['authenticationtoken'];
      if (!token || !isValidToken(token)) {
        return res.status(403).json({ message: 'Invalid or missing AuthenticationToken' });
      }
      next();
    });

    const isInternalUser = checkIfInternalUser(req.headers['authenticationtoken']);
    if (!isInternalUser) {
      const rating = await ratePackage(packageBuffer);
      if (rating < 0.5) {
        res.status(424).json({ message: 'Package is not uploaded due to the disqualified rating.' });
        return;
      }
    }
    */

    // Rate the package (NOT USING INTERNAL AUTHENTICATION)
    const rating = await ratePackage(packageBuffer);
    if (rating < 0.5) {
      // Assuming 0.5 as disqualification threshold
      res.status(424).json({
        message: 'Package is not uploaded due to the disqualified rating.',
      });
      return;
    }

    // Generate ID
    const packageID = crypto.createHash('sha256').update(Name + Version).digest('hex');

    // Check if package already exists
    try {
      await s3Client.send(
        new HeadObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME as string,
          Key: `${packageID}.tgz`,
        })
      );
      res.status(409).json({ message: 'Package already exists.' });
      return;
    } catch (error: any) {
      if (error.name !== 'NotFound' && error.$metadata?.httpStatusCode !== 404) {
        console.error('Error checking package existence:', error);
        res.status(500).json({ message: 'Server error' });
        return;
      }
      // If error is NotFound, proceed to upload
    }

    // Upload to AWS S3
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: `${packageID}.tgz`,
      Body: packageBuffer,
      ContentType: 'application/gzip',
    };

    try {
      await s3Client.send(new PutObjectCommand(params));
    } catch (error) {
      console.error('Error uploading package:', error);
      res.status(500).json({ message: 'Server error during upload' });
      return;
    }

    const packageMetadata = {
      Name: packageName,
      Version: packageVersion,
      ID: packageID,
      Source: Content ? 'Content' : 'URL',
    };

    // Save packageMetadata in metadata storage
    await savePackageMetadata(packageMetadata);
    
    // Build the response object
    const response = {
      metadata: {
        Name : packageName,
        Version : packageVersion,
        ID : packageID,
      },
      data: {
        ...(Content ? { Content : packageBuffer.toString('base64') } : {}),
        ...(URL ? { URL : URL } : {}),
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


// Route to handle GET requests for a package by ID
router.get('/package/:id', async (req, res) => {
  const packageID = req.params.id; // Capture the package ID from the URL
  try {
      // Logic to retrieve package data from your storage (e.g., database or S3)
      const packageData = await retrievePackageByID(packageID);
      if (packageData) {
          res.status(200).json(packageData);
      } else {
          res.status(404).json({ message: 'Package not found.' });
      }
  } catch (error) {
      console.error('Error retrieving package:', error);
      res.status(500).json({ message: 'Server error' });
  }
});


async function retrievePackageByID(packageID: string) {
  const query = 'SELECT * FROM packages WHERE id = $1'; // SQL query to fetch package data
  try {
      const db_connection = await dbConnectionPromise; 
      const res = await db_connection.execute(query, [packageID]);
      if (res.rows.length > 0) {
          return res.rows[0]; // Assuming ID is unique and only one record should be returned
      } else {
          return null; // No package found with the given ID
      }
  } catch (error) {
      console.error('Error retrieving package from database:', error);
      throw error; // Rethrow the error to handle it in the calling function
  }
}

export default router;
