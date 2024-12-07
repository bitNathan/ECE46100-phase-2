import express from 'express';
import dbConnectionPromise from './db';

const router = express.Router();

// Route to get all items from the registry table
router.post('/packages', async (req, res) => {
  try {
    const {
      packageId,
      version
    } = req.body;
    const offset = req.query.offset || 0;
    const offsetInt = parseInt(offset as string, 10);
    
    const pageSize = 10;
    let query = 'SELECT * FROM packages';
    let queryParams: any[] = [];

    // Establish db connection
    const db_connection = await dbConnectionPromise; 

    // check db connection status
    if (!db_connection) {
      res.status(500).json({ message: 'Database connection failed' });
      return;
    }

    // get packageId if specified
    if (packageId){
      query += ' WHERE package_name = ?';
      queryParams = [packageId];
    }

    // Handle version filtering if specified
    if (version) {
      if (version.includes('-')) {
        // Bounded range: "1.2.3-2.1.0"
        const [minVersion, maxVersion] = version.split('-');
        query += ' AND package_version >= ? AND package_version <= ?';
        queryParams.push(minVersion, maxVersion);
      } else if (version.startsWith('~') || version.startsWith('^')) {
        // Tilde and Caret ranges
        query += ' AND package_version LIKE ?';
        let modifiedVersion = version.slice(1); // Remove the tilde or caret
        modifiedVersion = modifiedVersion.replace(/\d+$/, '%'); // Replace the last numeric segment with '%'
        queryParams.push(modifiedVersion);
      } else {
        // Exact version
        query += ' AND package_version = ?';
        queryParams.push(version);
      }
    }

    const [rows] = await db_connection.execute(query, queryParams);
    // console.log("NEW REQUEST");
    // console.log("offsetInt", offsetInt);
    // console.log("offset", offset);
    // console.log("num rows", rows.length);

    // Map rows to handle buffer and simplify response
    const formattedRows = rows.map((row: any) => ({
      Version: row.package_version,
      Name: row.package_name,
      ID: row.id
    }));

  
    // Pagination logic
    const paginatedRows = formattedRows.slice(offsetInt * pageSize, (offsetInt * pageSize) + pageSize);

    // Check if there are any packages
    if (!paginatedRows.length) {
      res.status(404).json({message: 'No packages found'});
      return;
    }

    res.status(200).json(paginatedRows);

  } catch (error) {
    console.error('Error fetching registry items:', error);
    res.status(500).json({ message: 'Server Error fetching registry items' });
  }
});

export default router;