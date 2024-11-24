
import express from 'express';
const router = express.Router();
const mysql = require('mysql2/promise');

import dbConnectionPromise from './db';

router.post('/package/search/byRegEx', async (req: any, res: any) => {
    const { regex: RegEx } = req.body;
    console.log("Regex is", RegEx)

    if (!RegEx) {
        return res.status(400).json({ message: "Missing or invalid 'RegEx' field in the request body." });
    }

    try {
        // Assume db_connection is your database connection and is set up to use promises
        // const query = `SELECT * FROM packages WHERE package_name REGEXP ? OR readme REGEXP ?`;
        const query = `SELECT * FROM packages WHERE package_name REGEXP ?`;
        const db_connection = await dbConnectionPromise; 
        const [rows] = await db_connection.execute(query, [RegEx]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "No package found under this regex." });
        }

        const response = rows.map((row: any) => ({
            Version: row.version,
            Name: row.package_name,
            ID: row.id
        }));

        res.status(200).json(response);
    } catch (error: any) {
        console.error('Error searching for packages:', error);
        if (error.code === 'ER_BAD_FIELD_ERROR') {
            res.status(400).json({ message: "Regex format is invalid." });
        } else {
            res.status(500).json({ message: 'Server Error' });
        }
    }
});

export default router;
