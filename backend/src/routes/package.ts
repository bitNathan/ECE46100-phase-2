import express from 'express';
import multer from 'multer';
import { processPackage } from '../utils/packageProcessor';
import AWS from 'aws-sdk';

const router = express.Router();

// AWS Configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  region: process.env.AWS_REGION as string,
});

const s3 = new AWS.S3();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/package', upload.single('file'), async (req, res) => {
  try {
    console.log('req:', req);
    const { name, version, debloat } = req.body;
    const file = req.file;

    if (!name || !version || !file) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    let packageBuffer = file.buffer;

    if (debloat === 'true') {
      // Perform debloating
      packageBuffer = await processPackage(packageBuffer);
    }

    // Upload to AWS S3
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: `${name}-${version}.tgz`,
      Body: packageBuffer,
      ContentType: file.mimetype,
    };

    await s3.upload(params).promise();

    res.status(200).json({ message: 'Package uploaded successfully' });
  } catch (error) {
    console.error('Error uploading package:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
