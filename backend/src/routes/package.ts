import express from 'express';
import { processPackage } from '../utils/packageProcessor';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();

// AWS Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

// Placeholder ratePackage function
// ****Checking quality is only done on public ingest. ACME employees are trusted to upload code directly.
const ratePackage = async (packageBuffer: Buffer): Promise<number> => {
  // Implement package rating logic here
  // For now, return a random rating between 0 and 1
  return 1 //Math.random();
};

// Route to handle package upload/ingest
router.post('/package', async (req, res) => {
  try {
    const {
      Name,
      // POST /package: Here, a new package is created for the time in the registry, so we can assume the version to be 1.0.0. You might also consider reading the version from package.json if it exists.
      // POST /package: Copy the version from the URL.
      Version = '1.0.0',
      Content,
      URL,
      debloat = false,
      JSProgram = '',
    } = req.body;

    // Validate request body
    if (!Name) {
      res.status(400).json({ message: 'Missing Name' });
      return;
    }

    if ((Content && URL) || (!Content && !URL)) {
      res.status(400).json({
        message: 'Either Content or URL must be provided, but not both',
      });
      return;
    }

    let packageBuffer: Buffer | null = null;

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

    // Handle debloat if required
    if (debloat === true) {
      packageBuffer = await processPackage(packageBuffer);
    }

    // Rate the package
    const rating = await ratePackage(packageBuffer);
    if (rating < 0.5) {
      // Assuming 0.5 as disqualification threshold
      res.status(424).json({
        message: 'Package is not uploaded due to the disqualified rating.',
      });
      return;
    }

    // Generate ID
    const ID = crypto.createHash('sha256').update(Name + Version).digest('hex');

    // Check if package already exists
    try {
      await s3Client.send(
        new HeadObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME as string,
          Key: `${ID}.tgz`,
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
      Key: `${ID}.tgz`,
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

    // Build the response object
    const response = {
      metadata: {
        Name,
        Version,
        ID,
      },
      data: {
        Content: Content || undefined,
        URL: URL || undefined,
        JSProgram,
        debloat,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error uploading package:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
