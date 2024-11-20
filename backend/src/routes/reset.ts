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
router.delete('/reset', async (req, res) => {
  try {
    const [rows] = await db_connection.execute('SELECT * FROM packages');

    // Check if there are any packages
    if (!rows.length) {
      res.status(200).json({message: 'Registry already empty'});
      return;
    }

    // Reset the registry to the default state
    await db_connection.execute('DELETE FROM packages');

    // return pageSize packages
    res.status(200).json({ message: 'Registry successfully reset to default state' });
    return;
  } catch (error) {
    console.error('Error resetting registry:', error);
    res.status(500).json({ message: 'Server Error resetting registry' });
    return;
  }
});

export default router;