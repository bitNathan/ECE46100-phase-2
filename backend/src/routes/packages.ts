import express from 'express';


import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';


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
router.post('/packages', async (req, res) => {
  try {
    const {
      offset = 1, // Provide this for pagination. If not provided, returns the first page of results
      Version,
      Name
    } = req.body;

    // TODO - Implement pagination via offset
    // TODO version filtering
    // TODO name filtering

    // setup s3 bucket params
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME as string
    };

    // get the list of objects in the bucket
    const data = await s3Client.send(new ListObjectsV2Command(params));
    
    const packages = data.Contents;
    
    
    // Check if there are any packages
    if (!packages) {
      res.status(404).json({message: 'No packages found'});
      return;
    }
    

    // Build the response object
    const response = {
      packages: packages.map((p: any) => {
        return {
          Name: p.Key,
          Version: p.Size,
        };
      }, []),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting packages:', error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : 'Server error'
    });
  }
});

export default router;
