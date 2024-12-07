import express from 'express';
import dbConnectionPromise from './db';

const router = express.Router();

// download package
router.get('/package/:id', async (req, res) => {
    try {
      const packageID = req.params.id;
  
      // Check if packageID is provided
      if (!packageID) {
        res.status(400).json({ message: 'Package ID is required' });
        return;
      }

      // Establish db connection
      const db_connection = await dbConnectionPromise; 

      // check db connection status
      if (!db_connection) {
        res.status(500).json({ message: 'Database connection failed' });
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