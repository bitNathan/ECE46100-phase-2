import express from 'express';
import packagesRouter from './routes/packages';
import packageRouter from './routes/package';
import resetRouter from './routes/reset';
import cors from 'cors';
const app = express();

// Enable CORS for all routes
app.use(cors());

// Increase the JSON body size limit to 50MB (adjust as needed)
app.use(express.json({ limit: '100mb' }));

// Use the package router
app.use('/', packageRouter);
app.use('/', packagesRouter);
app.use('/', resetRouter);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
