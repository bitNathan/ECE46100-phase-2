import express from 'express';
import { S3Client, ListObjectsV2Command, ListObjectsV2Output } from '@aws-sdk/client-s3';


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
      Version,
      Name
    } = req.body;
    const offset = req.query.offset || 1;

    // Validate the offset
    const offsetInt = parseInt(offset as string, 10);
    if (isNaN(offsetInt)) {
      res.status(400).json({ message: 'Invalid offset value' });
      return;
    }

    // TODO version filtering
    // TODO name filtering
    
    // looping through pages
    let page_number = 1;
    const pageSize = 10;
    let NextContinuationToken = null;
    do {
      let params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME as string,
        MaxKeys: pageSize,
        ContinuationToken: NextContinuationToken ? NextContinuationToken : undefined,
      };

      // get the list of objects in the bucket
      const data: ListObjectsV2Output = await s3Client.send(new ListObjectsV2Command(params));
      const packages = data.Contents;
      // console.log(packages);  
      
      // Check if there are any packages
      if (!packages) {
        res.status(404).json({message: 'No packages found'});
        return;
      }

      // check if there are too many packages
      if (packages.length > 1000) {
        res.status(413).json({message: 'Too many packages found, use offset to paginate or filter'});
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

      if (page_number == offsetInt) {
        res.status(200).json(response);
        // console.log('response:', response);
        return;
      }
      
      // assign next token for paging
      NextContinuationToken = data.NextContinuationToken;
      page_number++;
    
    // should return before it gets here, but just in case
    } while (page_number <= offsetInt);
  
  } catch (error) {
    console.error('Error getting packages:', error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : 'Server error'
    });
  }
});

export default router;
