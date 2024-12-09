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
  import resetRouter from '../routes/reset';
  
  // Extract the executeMock for use in tests
  const { executeMock } = require('../routes/db');
  
  describe('DELETE /reset', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    test('should successfully reset the registry', async () => {
      // Mock db execute to return package data
      executeMock.mockResolvedValueOnce([[]]); // For SELECT * FROM packages
      executeMock.mockResolvedValueOnce([]); // For DELETE FROM packages
  
      // Create an Express app and use the router
      const app = express();
      app.use(express.json());
      app.use('/', resetRouter);
  
      // Send DELETE request
      const response = await request(app)
        .delete(`/reset`)
        .send({})
        .expect(200);
  
      // Check response
      expect(response.body).toHaveProperty('message', 'Registry is reset');
  
      // Check that db execute was called with correct queries
      expect(executeMock).toHaveBeenNthCalledWith(1, 'SELECT * FROM packages');
      expect(executeMock).toHaveBeenNthCalledWith(2, 'DELETE FROM packages');
    });
  
    test('should return 200 when registry is already empty', async () => {
      // Mock db execute to return empty array
      executeMock.mockResolvedValueOnce([[]]);
  
      // Create an Express app and use the router
      const app = express();
      app.use(express.json());
      app.use('/', resetRouter);
  
      // Send DELETE request
      const response = await request(app)
        .delete(`/reset`)
        .send({})
        .expect(200);
  
      expect(response.body).toHaveProperty('message', 'Registry is reset');
  
      // Check that db execute was called
      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM packages')
    });
  
    test('should return 500 when database connection fails', async () => {
      // Reset modules and re-mock dbConnectionPromise to return null
      jest.resetModules();
  
      jest.mock('../routes/db', () => ({
        __esModule: true,
        default: Promise.resolve(null),
      }));
  
      // Re-import the router to pick up the new mock
      const resetRouter = require('../routes/reset').default;
  
      // Create a new Express app and use the re-imported router
      const app = express();
      app.use(express.json());
      app.use('/', resetRouter);
  
      // Send DELETE request
      const response = await request(app)
        .delete(`/reset`)
        .send({})
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
      app.use('/', resetRouter);
  
      // Send DELETE request
      const response = await request(app)
        .delete(`/reset`)
        .send({})
        .expect(500);
  
      expect(response.body).toHaveProperty('message', 'Server Error resetting registry');
  
      // Check that db execute was called
      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM packages');
    });
  });
