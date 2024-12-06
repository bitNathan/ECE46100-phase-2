import express from 'express';
import dbConnectionPromise from './db';

const router = express.Router();

// Route to get all items from the registry table
router.delete('/reset', async (req, res) => {
  try {

    // Establish db connection
    const db_connection = await dbConnectionPromise; 

    // check db connection status
    if (!db_connection) {
      res.status(500).json({ message: 'Database connection failed' });
      return;
    }

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