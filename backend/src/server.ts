import express from 'express';
import packageRouter from './routes/package';
import cors from 'cors';

const app = express();

// Enable CORS for all routes
app.use(cors());

// Enable JSON parsing
app.use(express.json());

// Use the package router
app.use('/', packageRouter);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});