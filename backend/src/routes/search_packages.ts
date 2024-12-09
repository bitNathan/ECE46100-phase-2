
import express from 'express';
import dbConnectionPromise from './db';

const router = express.Router();

router.post('/package/byRegEx', async (req: any, res: any) => {
    const { regex: RegEx } = req.body;
    console.log("Regex is", RegEx)

    if (!RegEx) {
        return res.status(400).json({ message: "Missing or invalid 'RegEx' field in the request body." });
    }

    try {
        
        const query = `SELECT * FROM packages WHERE package_name REGEXP ? OR readme REGEXP ?`;
        
        // Establish db connection
        const db_connection = await dbConnectionPromise; 

        // check db connection status
        if (!db_connection) {
            return res.status(500).json({ message: 'Database connection failed' });
        }

        const [rows] = await db_connection.execute(query, [RegEx, RegEx]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "No package found under this regex." });
        }

        const response = rows.map((row: any) => ({
            Version: row.package_version,
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
