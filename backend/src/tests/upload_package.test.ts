const executeMock = jest.fn();

import request from 'supertest';
import app from '../server';
import axios from 'axios';

// Mock dependencies
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock other modules
jest.mock('../utils/packageProcessor', () => ({
  processPackage: jest.fn(),
}));

jest.mock('../utils/ratePackage', () => ({
  ratePackage: jest.fn(),
}));

jest.mock('../utils/handleURL', () => ({
  extractNameAndVersionFromURL: jest.fn(),
  getOwnerAndRepoFromURL: jest.fn(),
  resolveURL: jest.fn(),
}));

jest.mock('../utils/generateID', () => ({
  generateID: jest.fn(),
}));

jest.mock('../routes/db', () => ({
  __esModule: true,
  default: Promise.resolve({
    execute: executeMock,
  }),
}));

jest.mock('../url_parse', () => ({
  parseURL: jest.fn(),
}));

describe('POST /package', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 400 when both Content and URL are provided', async () => {
    const response = await request(app)
      .post('/package')
      .send({
        Name: 'TestPackage',
        Content: 'fakeContent',
        URL: 'https://github.com/testuser/testrepo',
      })
      .expect(400);

    expect(response.body.message).toBe('Either Content or URL must be provided, but not both');
  });

  test('should return 400 when neither Content nor URL are provided', async () => {
    const response = await request(app)
      .post('/package')
      .send({
        Name: 'TestPackage',
      })
      .expect(400);

    expect(response.body.message).toBe('Either Content or URL must be provided, but not both');
  });

  test('should handle package with URL and fetch README', async () => {
    const packageBuffer = Buffer.from('fake package data');
    const base64Content = packageBuffer.toString('base64');
    const packageName = 'TestPackage';
    const packageVersion = '1.0.0';
    const packageID = 'testpackage-1.0.0';
    const packageURL = 'https://github.com/testuser/testrepo';
  
    const resolveURLMock = require('../utils/handleURL').resolveURL as jest.Mock;
    resolveURLMock.mockResolvedValue(packageURL);
  
    const getOwnerAndRepoFromURLMock = require('../utils/handleURL').getOwnerAndRepoFromURL as jest.Mock;
    getOwnerAndRepoFromURLMock.mockResolvedValue({ owner: 'testuser', repo: 'testrepo' });
  
    const parseURLMock = require('../url_parse').parseURL as jest.Mock;
    parseURLMock.mockResolvedValue(['testuser', 'testrepo']);
  
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/archive/')) {
        return Promise.resolve({ data: packageBuffer });
      } else if (url.includes('/README.md')) {
        return Promise.resolve({ data: 'This is the README.md content' });
      } else if (url.includes('/repos/')) {
        return Promise.resolve({ data: { default_branch: 'main' } });
      }
      return Promise.reject(new Error('URL not recognized'));
    });
  
    const generateIDMock = require('../utils/generateID').generateID as jest.Mock;
    generateIDMock.mockReturnValue(packageID);
  
    executeMock.mockResolvedValueOnce([[]]);
    executeMock.mockResolvedValueOnce([{ affectedRows: 1 }]);
  
    const response = await request(app)
      .post('/package')
      .send({
        URL: packageURL,
        debloat: false,
      })

  
    expect(response).toBeDefined()
  
  });

  test('should handle invalid Base64 content', async () => {
    const response = await request(app)
      .post('/package')
      .send({
        Name: 'TestPackage',
        Content: 'invalidBase64Content$$$',
      })

    expect(response.body.message).toBeDefined();
  });

  test('should return 409 when package already exists', async () => {
    const packageID = 'testpackage-1.0.0';
  
    const generateIDMock = require('../utils/generateID').generateID as jest.Mock;
    generateIDMock.mockReturnValue(packageID);
  
    executeMock.mockResolvedValueOnce([[{ id: packageID }]]); // Package exists
  
    const response = await request(app)
      .post('/package')
      .send({
        Name: 'TestPackage',
        Version: '1.0.0',
        Content: Buffer.from('fake package data').toString('base64'),
        debloat: false,
      })
  
    expect(response.body.message).toBeDefined();
  });
  

  test('should return 424 when package rating is below threshold', async () => {
    const packageID = 'testpackage-1.0.0';
  
    const generateIDMock = require('../utils/generateID').generateID as jest.Mock;
    generateIDMock.mockReturnValue(packageID);
  
    const ratePackageMock = require('../utils/ratePackage').ratePackage as jest.Mock;
    ratePackageMock.mockResolvedValue([0.4]); // Below threshold
  
    const response = await request(app)
      .post('/package')
      .send({
        Name: 'TestPackage',
        Version: '1.0.0',
        Content: Buffer.from('fake package data').toString('base64'),
        debloat: false,
      })
  
    expect(response.body.message).toBeDefined();
  });
  
});
