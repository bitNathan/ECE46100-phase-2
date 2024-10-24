import express from 'express';
import dotenv from 'dotenv';
import packageRouter from './routes/package';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/', packageRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
