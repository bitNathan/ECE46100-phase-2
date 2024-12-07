// Mock the database connection before any imports
jest.mock('../routes/db', () => {
    const executeMock = jest.fn();
    return {
      __esModule: true,
      default: Promise.resolve({
        execute: executeMock,
      }),
      executeMock,
    };
  });
  
  // Import necessary modules after mocking
  import request from 'supertest';
  import express from 'express';
  
  // Import the router after mocking dbConnectionPromise
  import downloadPackageRouter from '../routes/downloadPackage';
  
  // Extract the executeMock for use in tests
  const { executeMock } = require('../routes/db');
  
  describe('GET /package/:id', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    test('should successfully retrieve a package', async () => {
      const packageID = 'testpackage-1.0.0';
      const packageData = {
        package_name: 'TestPackage',
        package_version: '1.0.0',
        content: Buffer.from('fake package data'),
        url: 'https://github.com/testuser/testrepo',
        js_program: 'console.log("Hello World");',
      };
  
      // Mock db execute to return package data
      executeMock.mockResolvedValueOnce([[packageData]]);
  
      // Create an Express app and use the router
      const app = express();
      app.use('/', downloadPackageRouter);
  
      // Send GET request
      const response = await request(app)
        .get(`/package/${packageID}`)
        .expect(200);
  
      // Check response
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toEqual({
        Name: packageData.package_name,
        Version: packageData.package_version,
        ID: packageID,
      });
  
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('Content');
      expect(response.body.data.Content).toBe(packageData.content.toString('base64'));
      expect(response.body.data).toHaveProperty('URL');
      expect(response.body.data.URL).toBe(packageData.url);
      expect(response.body.data).toHaveProperty('JSProgram');
      expect(response.body.data.JSProgram).toBe(packageData.js_program);
  
      // Check that db execute was called with correct query
      expect(executeMock).toHaveBeenCalledWith(
        'SELECT package_name, package_version, content, url, js_program FROM packages WHERE id = ?',
        [packageID]
      );
    });
  
    test('should return 404 when package is not found', async () => {
      const packageID = 'nonexistent-package';
  
      // Mock db execute to return empty array
      executeMock.mockResolvedValueOnce([[]]);
  
      // Create an Express app and use the router
      const app = express();
      app.use('/', downloadPackageRouter);
  
      // Send GET request
      const response = await request(app)
        .get(`/package/${packageID}`)
        .expect(404);
  
      expect(response.body).toHaveProperty('message', 'Package does not exist.');
  
      // Check that db execute was called
      expect(executeMock).toHaveBeenCalledWith(
        'SELECT package_name, package_version, content, url, js_program FROM packages WHERE id = ?',
        [packageID]
      );
    });
  
    test('should return 500 when database connection fails', async () => {
      const packageID = 'testpackage-1.0.0';
  
      // Reset modules and re-mock dbConnectionPromise to return null
      jest.resetModules();
  
      jest.mock('../routes/db', () => ({
        __esModule: true,
        default: Promise.resolve(null),
      }));
  
      // Re-import the router to pick up the new mock
      const downloadPackageRouter = require('../routes/downloadPackage').default;
  
      // Create a new Express app and use the re-imported router
      const app = express();
      app.use(express.json());
      app.use('/', downloadPackageRouter);
  
      // Send GET request
      const response = await request(app)
        .get(`/package/${packageID}`)
        .expect(500);
  
      expect(response.body).toHaveProperty('message', 'Database connection failed');
  
      // Restore the original dbConnectionPromise mock
      jest.resetModules();
    });
  
    test('should return 500 when database query throws an error', async () => {
      const packageID = 'testpackage-1.0.0';
  
      // Mock db execute to throw an error
      executeMock.mockRejectedValueOnce(new Error('Database query error'));
  
      // Create an Express app and use the router
      const app = express();
      app.use('/', downloadPackageRouter);
  
      // Send GET request
      const response = await request(app)
        .get(`/package/${packageID}`)
        .expect(500);
  
      expect(response.body).toHaveProperty('message', 'Database query error');
  
      // Check that db execute was called
      expect(executeMock).toHaveBeenCalledWith(
        'SELECT package_name, package_version, content, url, js_program FROM packages WHERE id = ?',
        [packageID]
      );
    });
  
    test('should handle package without URL and JSProgram', async () => {
      const packageID = 'testpackage-1.0.0';
      const packageData = {
        package_name: 'TestPackage',
        package_version: '1.0.0',
        content: Buffer.from('fake package data'),
        url: null,
        js_program: null,
      };
  
      // Mock db execute to return package data
      executeMock.mockResolvedValueOnce([[packageData]]);
  
      // Create an Express app and use the router
      const app = express();
      app.use('/', downloadPackageRouter);
  
      // Send GET request
      const response = await request(app)
        .get(`/package/${packageID}`)
        .expect(200);
  
      // Check response
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toEqual({
        Name: packageData.package_name,
        Version: packageData.package_version,
        ID: packageID,
      });
  
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('Content');
      expect(response.body.data.Content).toBe(packageData.content.toString('base64'));
      expect(response.body.data).not.toHaveProperty('URL');
      expect(response.body.data).toHaveProperty('JSProgram');
      expect(response.body.data.JSProgram).toBeNull();
  
      // Check that db execute was called with correct query
      expect(executeMock).toHaveBeenCalledWith(
        'SELECT package_name, package_version, content, url, js_program FROM packages WHERE id = ?',
        [packageID]
      );
    });
  
    test('should handle unexpected errors gracefully', async () => {
      const packageID = 'testpackage-1.0.0';
  
      // Mock db execute to throw an unknown error
      executeMock.mockRejectedValueOnce('Unknown error');
  
      // Create an Express app and use the router
      const app = express();
      app.use('/', downloadPackageRouter);
  
      // Send GET request
      const response = await request(app)
        .get(`/package/${packageID}`)
        .expect(500);
  
      expect(response.body).toHaveProperty('message', 'Server error');
  
      // Check that db execute was called
      expect(executeMock).toHaveBeenCalledWith(
        'SELECT package_name, package_version, content, url, js_program FROM packages WHERE id = ?',
        [packageID]
      );
    });
  
    test('should return 500 when content is not a buffer', async () => {
      const packageID = 'testpackage-1.0.0';
      const packageData = {
        package_name: 'TestPackage',
        package_version: '1.0.0',
        content: null, // Simulate content being null or invalid
        url: 'https://github.com/testuser/testrepo',
        js_program: 'console.log("Hello World");',
      };
  
      // Mock db execute to return package data with invalid content
      executeMock.mockResolvedValueOnce([[packageData]]);
  
      // Create an Express app and use the router
      const app = express();
      app.use('/', downloadPackageRouter);
  
      // Send GET request
      const response = await request(app)
        .get(`/package/${packageID}`)
        .expect(500);
  
      expect(response.body).toHaveProperty('message');
  
      // Check that db execute was called with correct query
      expect(executeMock).toHaveBeenCalledWith(
        'SELECT package_name, package_version, content, url, js_program FROM packages WHERE id = ?',
        [packageID]
      );
    });
  });
  