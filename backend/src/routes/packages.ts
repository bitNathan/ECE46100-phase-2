import express from 'express';
const mysql = require('mysql2/promise');

const router = express.Router();

// AWS RDS Configuration
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
    // console.log('Database connection established successfully');
  } catch (error) {
    // Log the environment variables to ensure they are being read correctly
    console.log('Database configuration:', {
      host: process.env.AWS_RDS_ENDPOINT,
      user: process.env.AWS_RDS_USERNAME, 
      password: process.env.AWS_RDS_PASSWORD,
      port: process.env.AWS_RDS_PORT,
      database: process.env.AWS_RDS_DATABASE_NAME
    });
    console.error('Error connecting to the database:', error);
  }
})();

// Route to get all items from the registry table
router.post('/packages', async (req, res) => {
  try {
    const {
      Version,
      Name
    } = req.body;
    const offset = req.query.offset || 1;
    const offsetInt = parseInt(offset as string, 10);
    
    const pageSize = 10;
    // TODO version filtering
    // TODO name filtering
    const [rows] = await db_connection.execute('SELECT * FROM packages');

    // pagination
    for (let i = 0; i < offsetInt; i++) {
      rows.splice(0, pageSize);
    }

    // Check if there are any packages
    if (!rows.length) {
      res.status(404).json({message: 'No packages found'});
      return;
    }

    // return pageSize packages
    res.status(200).json(rows.splice(0, pageSize));
  } catch (error) {
    console.error('Error fetching registry items:', error);
    res.status(500).json({ message: 'Server Error fetching registry items' });
  }
});

// old route that uses s3 bucket
// router.post('/packages', async (req, res) => {
//   try {
//     const {
//       Version,
//       Name
//     } = req.body;
//     const offset = req.query.offset || 1;

//     // Validate the offset
//     const offsetInt = parseInt(offset as string, 10);
//     if (isNaN(offsetInt)) {
//       res.status(400).json({ message: 'Invalid offset value' });
//       return;
//     }
    
//     // looping through pages
//     let page_number = 1;
//     const pageSize = 10;

//     do {
//       // Query to get packages from the RDS database
//       const [rows] = await db_connection.execute(
//         `SELECT Name, Version FROM packages LIMIT ? OFFSET ?`,
//         [pageSize, (page_number - 1) * pageSize]
//       );
//       const packages = rows as any[];

//       // Check if there are any packages
//       if (!packages.length) {
//         res.status(404).json({message: 'No packages found'});
//         return;
//       }

//       // check if there are too many packages
//       if (packages.length > 1000) {
//         res.status(413).json({message: 'Too many packages found, use offset to paginate or filter'});
//         return;
//       }
    
//       // Build the response object
//       const response = {
//         packages: packages.map((p: any) => {
//           return {
//             Name: p.Name,
//             Version: p.Version,
//           };
//         }),
//       };

//       if (page_number == offsetInt) {
//         res.status(200).json(response);
//         return;
//       }
      
//       page_number++;
    
//     // should return before it gets here, but just in case
//     } while (page_number <= offsetInt);
  
//   } catch (error) {
//     console.error('Error getting packages:', error);
//     res.status(400).json({ 
//       message: error instanceof Error ? error.message : 'Server error'
//     });
//   }
// });

// db_connection.end();

export default router;