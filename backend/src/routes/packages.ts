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
      packageId,
      version
    } = req.body;
    const offset = req.query.offset || 1;
    const offsetInt = parseInt(offset as string, 10);
    
    const pageSize = 10;
    let query = 'SELECT * FROM packages WHERE package_name = ?';
    let queryParams = [packageId];

    // Handle version filtering if specified
    if (version) {
      if (version.includes('-')) {
        // Bounded range: "1.2.3-2.1.0"
        const [minVersion, maxVersion] = version.split('-');
        query += ' AND version >= ? AND version <= ?';
        queryParams.push(minVersion, maxVersion);
      } else if (version.startsWith('~') || version.startsWith('^')) {
        // Tilde and Caret ranges
        query += ' AND version LIKE ?';
        let modifiedVersion = version.slice(1); // Remove the tilde or caret
        modifiedVersion = modifiedVersion.replace(/\d+$/, '%'); // Replace the last numeric segment with '%'
        queryParams.push(modifiedVersion);
      } else {
        // Exact version
        query += ' AND version = ?';
        queryParams.push(version);
      }
    }

    const [rows] = await db_connection.execute(query, queryParams);
    console.log("result", rows, query, queryParams)

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

export default router;