const mysql = require('mysql2/promise'); // mysql2 supports promises, which work well with async/await

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// AWS RDS Configuration
// Self-invoking function to create and export a database connection promise
const db_connection = (async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.AWS_RDS_ENDPOINT,
            user: process.env.AWS_RDS_USERNAME,
            password: process.env.AWS_RDS_PASSWORD,
            database: process.env.AWS_RDS_DATABASE_NAME,
            port: parseInt(process.env.AWS_RDS_PORT as string, 10)
        });
        console.log('Database connection established successfully');
        return connection;
    } catch (error) {
        console.error('Error connecting to the database:', error);
        return null;
    }
})();

export default db_connection;

