import express from 'express';
import resetRouter from '../routes/reset';
const request = require('supertest');
const connection = require('../connection');

jest.mock('../connection', () => ({
  execute: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/reset', resetRouter);

describe('deleteAllEntries API', () => {
  let req: {}
  let res: { status: any; json: any; };

  beforeEach(() => {
    req = {}; // Mocked request object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should return code 200 if the database was already empty', async () => {
    // Mock the database response to simulate an empty database
    connection.execute.mockResolvedValueOnce([[]]);

    const response = await request(app).delete('/reset');

    // Assertions
    // expect(connection.execute).toHaveBeenCalledWith('SELECT * FROM packages');
    // expect(connection.execute).not.toHaveBeenCalledWith('DELETE FROM packages');
    expect(response.body).toEqual({ message: 'Registry already empty' });
    expect(response.status).toBe(200);
  });

  it('should reset the registry and return code 200 if there were entries', async () => {
    // Mock the database response to simulate a non-empty database
    connection.execute.mockResolvedValueOnce([[{ id: 1, name: 'package1' }]]);
    // connection.execute.mockResolvedValueOnce([]);

    const response = await request(app).delete('/reset');

    // Assertions
    // expect(connection.execute).toHaveBeenCalledWith('SELECT * FROM packages');
    // expect(connection.execute).toHaveBeenCalledWith('DELETE FROM packages');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Registry successfully reset to default state' });
  });

  it('should return code 500 if there is a server error', async () => {
    // Mock the database response to simulate a server error
    connection.execute.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).delete('/reset');

    // Assertions
    expect(connection.execute).toHaveBeenCalledWith('SELECT * FROM packages');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Server Error resetting registry' });
  });
});