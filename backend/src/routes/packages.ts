import express from 'express';
import dbConnectionPromise from './db';

const router = express.Router();

// Route to get all items from the registry table
router.post('/packages', async (req, res) => {
  try {
    const [{ Name, Version }] = req.body;
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

    // get Name if specified
    if (!Name) {
      res.status(400).json({ message: 'Package Name is required' });
      return;
    }
    else if (Name == '*') {
      // Wildcard: fetch all packages
      query += ' WHERE package_name IS NOT NULL';
    }
    else {
      query += ' WHERE package_name = ?';
      queryParams = [Name];
    }

    // Handle Version filtering if specified
    if (!Version) {
      res.status(400).json({ message: 'Package Version is required' });
      return;
    }
    else{
      if (Version === '*') {
        // Wildcard: fetch all Versions
        query += ' AND package_Version IS NOT NULL';
      }
      else if (Version.includes('-')) {
        // Bounded range: "1.2.3-2.1.0"
        const [minVersion, maxVersion] = Version.split('-');
        query += ' AND package_Version >= ? AND package_Version <= ?';
        queryParams.push(minVersion, maxVersion);
      } else if (Version.startsWith('~') || Version.startsWith('^')) {
        // Tilde and Caret ranges
        query += ' AND package_Version LIKE ?';
        let version_query = Version.replace('~', '').replace('^', '');
        version_query += '%';
        queryParams.push(version_query);

      } else {
        // Exact Version
        query += ' AND package_Version = ?';
        queryParams.push(Version);
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