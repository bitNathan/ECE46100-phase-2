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
  import fetchPackagesRouter from '../routes/packages';
  
  // Extract the executeMock for use in tests
  const { executeMock } = require('../routes/db');
  
  describe('POST /packages', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    
    test('should successfully retrieve all packages', async () => {
      const packageData = [
        {
          id: '1',
          package_name: 'TestPackage1',
          package_version: '1.0.0',
        },
        {
          id: '2',
          package_name: 'TestPackage2',
          package_version: '2.0.0',
        }
      ];
  
      // Mock db execute to return package data
      executeMock.mockResolvedValueOnce([packageData]);
  
      // Create an Express app and use the router
      const app = express();
      app.use(express.json());
      app.use('/', fetchPackagesRouter);
  
      // Send POST request
      const response = await request(app)
        .post(`/packages`)
        .send([{ Name: '*', Version: '*' }])
        .expect(200);
  
      // Check response
      expect(response.body).toEqual([
        { ID: '1', Name: 'TestPackage1', Version: '1.0.0' },
        { ID: '2', Name: 'TestPackage2', Version: '2.0.0' }
      ]);
  
      // Check that db execute was called with correct query
      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM packages WHERE package_name IS NOT NULL AND package_Version IS NOT NULL', []);
    });
  
    test('should return 404 when no packages are found', async () => {
      // Mock db execute to return empty array
      executeMock.mockResolvedValueOnce([[]]);
  
      // Create an Express app and use the router
      const app = express();
      app.use(express.json());
      app.use('/', fetchPackagesRouter);
  
      // Send POST request
      const response = await request(app)
        .post(`/packages`)
        .send([{ Name: '*', Version: '*' }])
        .expect(200);
  
  
      // Check that db execute was called with correct query
      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM packages WHERE package_name IS NOT NULL AND package_Version IS NOT NULL', []);
    });
  
    test('should return 500 when database connection fails', async () => {
      // Reset modules and re-mock dbConnectionPromise to return null
      jest.resetModules();
  
      jest.mock('../routes/db', () => ({
        __esModule: true,
        default: Promise.resolve(null),
      }));
  
      // Re-import the router to pick up the new mock
      const fetchPackagesRouter = require('../routes/packages').default;
  
      // Create a new Express app and use the re-imported router
      const app = express();
      app.use(express.json());
      app.use('/', fetchPackagesRouter);
  
      // Send POST request
      const response = await request(app)
        .post(`/packages`)
        .send([{ Name: '*', Version: '*' }])
        .expect(500);
  
      expect(response.body).toHaveProperty('message', 'Database connection failed');
  
      // Restore the original dbConnectionPromise mock
      jest.resetModules();
    });
  
    test('should return 500 when database query throws an error', async () => {
      // Mock db execute to throw an error
      executeMock.mockRejectedValueOnce(new Error('Database query error'));
  
      // Create an Express app and use the router
      const app = express();
      app.use(express.json());
      app.use('/', fetchPackagesRouter);
  
      // Send POST request
      const response = await request(app)
        .post(`/packages`)
        .send([{ Name: '*', Version: '*' }])
        .expect(500);
  
      expect(response.body).toHaveProperty('message', 'Server Error fetching registry items');
  
      // Check that db execute was called
      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM packages WHERE package_name IS NOT NULL AND package_Version IS NOT NULL', []);
    });

    // should return 400 with bad request
    test('should return 400 with bad request', async () => {
      // Create an Express app and use the router
      const app = express();
      app.use(express.json());
      app.use('/', fetchPackagesRouter);
  
      // Send POST request
      const response = await request(app)
        .post(`/packages`)
        .send([{}])
        .expect(400);
  
      expect(response.body).toHaveProperty('message', 'Package Name is required');
    });
  
    test('should handle packageId and version filtering', async () => {
      const packageData = [
        {
          id: '1',
          package_name: 'TestPackage1',
          package_version: '1.0.0',
        }
      ];
  
      // Mock db execute to return package data
      executeMock.mockResolvedValueOnce([packageData]);
  
      // Create an Express app and use the router
      const app = express();
      app.use(express.json());
      app.use('/', fetchPackagesRouter);
  
      // Send POST request with packageId and version
      const response = await request(app)
        .post(`/packages`)
        .send([{ "Name": "TestPackage1", "Version": "1.0.0" }])
        .expect(200);
  
      // Check response
      expect(response.body).toEqual([
        { ID: '1', Name: 'TestPackage1', Version: '1.0.0' }
      ]);
  
      // Check that db execute was called with correct query
      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM packages WHERE package_name = ? AND package_Version = ?',
        ['TestPackage1', '1.0.0']
      );
    });

    test('should return 400 when package name is missing', async () => {
      // Create an Express app and use the router
      const app = express();
      app.use(express.json());
      app.use('/', fetchPackagesRouter);
  
      // Send POST request with missing package name
      const response = await request(app)
        .post(`/packages`)
        .send([{ Version: '1.0.0' }])
        .expect(400);
  
      expect(response.body).toHaveProperty('message', 'Package Name is required');
    });
  
    test('should return 400 when package version is missing', async () => {
      // Create an Express app and use the router
      const app = express();
      app.use(express.json());
      app.use('/', fetchPackagesRouter);
  
      // Send POST request with missing package version
      const response = await request(app)
        .post(`/packages`)
        .send([{ Name: 'TestPackage1' }])
        .expect(400);
  
      expect(response.body).toHaveProperty('message', 'Package Version is required');
    });
  
    test('should handle version range filtering', async () => {
      const packageData = [
        {
          id: '1',
          package_name: 'TestPackage1',
          package_version: '1.5.0',
        }
      ];
  
      // Mock db execute to return package data
      executeMock.mockResolvedValueOnce([packageData]);
  
      // Create an Express app and use the router
      const app = express();
      app.use(express.json());
      app.use('/', fetchPackagesRouter);
  
      // Send POST request with version range
      const response = await request(app)
        .post(`/packages`)
        .send([{ Name: 'TestPackage1', Version: '1.0.0-2.0.0' }])
        .expect(200);
  
      // Check response
      expect(response.body).toEqual([
        { ID: '1', Name: 'TestPackage1', Version: '1.5.0' }
      ]);
  
      // Check that db execute was called with correct query
      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM packages WHERE package_name = ? AND package_Version >= ? AND package_Version <= ?',
        ['TestPackage1', '1.0.0', '2.0.0']
      );
    });
  });
