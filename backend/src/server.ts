import express from 'express';
import packagesRouter from './routes/packages';
import resetRouter from './routes/reset';
import uploadPackageRouter from './routes/uploadPackage';
import downloadPackageRouter from './routes/downloadPackage';
import searchPackagesRouter from './routes/search_packages';
import recommendRouter from './routes/recommend';
import cors from 'cors';
const app = express();

require('dotenv').config();

// Enable CORS for all routes
app.use(cors());

// Increase the JSON body size limit to 50MB (adjust as needed)
app.use(express.json({ limit: '100mb' }));

// Use the package router
app.use('/', uploadPackageRouter);
app.use('/', searchPackagesRouter)
app.use('/', downloadPackageRouter);
app.use('/', packagesRouter);
app.use('/', resetRouter);
app.use('/', recommendRouter);

// Start the server
if (require.main === module) { // due to testing
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

export default app; // for testing
