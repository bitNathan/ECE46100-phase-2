const mysql = require('mysql2/promise'); // mysql2 supports promises, which work well with async/await
import dotenv from 'dotenv';
dotenv.config();
// AWS RDS Configuration
// Self-invoking function to create and export a database connection promise
const db_connection = (async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT as string, 10)
        });
        console.log('Database connection established successfully');
        return connection;
    } catch (error) {
        console.error('Error connecting to the database:', error);
        // Re-throw the error to make it catchable when the promise is used
        // throw error;
    }
})();

export default db_connection;

