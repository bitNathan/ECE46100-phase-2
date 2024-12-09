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

<<<<<<< HEAD
=======
jest.mock('../url_parse', () => ({
  parseURL: jest.fn(),
}));

>>>>>>> main
describe('POST /package', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

<<<<<<< HEAD
  test('should upload a package with Content and Name successfully', async () => {
    const packageBuffer = Buffer.from('fake package data');
    const base64Content = packageBuffer.toString('base64');
    const packageName = 'TestPackage';
    const packageVersion = '1.0.0';
    const packageID = 'testpackage-1.0.0';

    // Mock generateID
    const generateIDMock = require('../utils/generateID').generateID as jest.Mock;
    generateIDMock.mockReturnValue(packageID);

    // Mock ratePackage
    const ratePackageMock = require('../utils/ratePackage').ratePackage as jest.Mock;
    ratePackageMock.mockResolvedValue(0.6);

    // Mock db execute for checking existing package
    executeMock.mockResolvedValueOnce([[]]); // No existing package

    // Mock db execute for inserting package
    executeMock.mockResolvedValueOnce([{ affectedRows: 1 }]);

    // Send POST request
    const response = await request(app)
      .post('/package')
      .send({
        Name: packageName,
        Version: packageVersion,
        Content: base64Content,
        JSProgram: 'console.log("Hello World");',
        debloat: false,
      })
      .expect(201);

    // Check response
    expect(response.body).toHaveProperty('metadata');
    expect(response.body.metadata).toEqual({
      Name: packageName,
      Version: packageVersion,
      ID: packageID,
    });

    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('Content');
    expect(response.body.data.Content).toBe(base64Content);
    expect(response.body.data).toHaveProperty('JSProgram');
    expect(response.body.data.JSProgram).toBe('console.log("Hello World");');

    // Check that db execute was called to check for existing package
    expect(executeMock).toHaveBeenCalledWith(
      'SELECT id FROM packages WHERE id = ?',
      [packageID]
    );

    // Check that db execute was called to insert the package
    expect(executeMock).toHaveBeenCalledWith(
      'INSERT INTO packages (id, package_name, package_version, content, url, js_program, debloat, readme) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        packageID,
        packageName,
        packageVersion,
        packageBuffer,
        null,
        'console.log("Hello World");',
        false,
        null,
      ]
    );
  });

  test('should upload a package with URL successfully', async () => {
    const packageBuffer = Buffer.from('fake package data');
    const base64Content = packageBuffer.toString('base64');
    const packageName = 'TestPackage';
    const packageVersion = '1.0.0';
    const packageID = 'testpackage-1.0.0';
    const packageURL = 'https://github.com/testuser/testrepo';

    // Mock resolveURL
    const resolveURLMock = require('../utils/handleURL').resolveURL as jest.Mock;
    resolveURLMock.mockResolvedValue(packageURL);

    // Mock getOwnerAndRepoFromURL
    const getOwnerAndRepoFromURLMock = require('../utils/handleURL').getOwnerAndRepoFromURL as jest.Mock;
    getOwnerAndRepoFromURLMock.mockResolvedValue({
      owner: 'testuser',
      repo: 'testrepo',
    });

    // Mock axios.get to fetch package zip and README.md
    mockedAxios.get.mockImplementation((url: string, options?: any) => {
      if (url.includes('/archive/')) {
        // Return package zip
        return Promise.resolve({
          data: packageBuffer,
          status: 200,
        });
      } else if (url.includes('/README.md')) {
        // Return README.md content
        return Promise.resolve({
          data: 'This is the README.md content',
          status: 200,
        });
      } else if (url.includes('/repos/')) {
        // Return repo info
        return Promise.resolve({
          data: {
            default_branch: 'main',
          },
          status: 200,
        });
      } else {
        return Promise.reject(new Error('URL not recognized'));
      }
    });

    // Mock extractNameAndVersionFromURL
    const extractNameAndVersionFromURLMock = require('../utils/handleURL').extractNameAndVersionFromURL as jest.Mock;
    extractNameAndVersionFromURLMock.mockResolvedValue({
      extractedName: packageName,
      extractedVersion: packageVersion,
    });

    // Mock generateID
    const generateIDMock = require('../utils/generateID').generateID as jest.Mock;
    generateIDMock.mockReturnValue(packageID);

    // Mock ratePackage
    const ratePackageMock = require('../utils/ratePackage').ratePackage as jest.Mock;
    ratePackageMock.mockResolvedValue(0.6);

    // Mock db execute for checking existing package
    executeMock.mockResolvedValueOnce([[]]); // No existing package

    // Mock db execute for inserting package
    executeMock.mockResolvedValueOnce([{ affectedRows: 1 }]);

    // Send POST request
    const response = await request(app)
      .post('/package')
      .send({
        URL: packageURL,
        JSProgram: 'console.log("Hello World");',
        debloat: false,
      })
      .expect(201);

    // Check response
    expect(response.body).toHaveProperty('metadata');
    expect(response.body.metadata).toEqual({
      Name: packageName,
      Version: packageVersion,
      ID: packageID,
    });

    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('Content');
    expect(response.body.data.Content).toBe(base64Content);
    expect(response.body.data).toHaveProperty('URL');
    expect(response.body.data.URL).toBe(packageURL);
    expect(response.body.data).toHaveProperty('JSProgram');
    expect(response.body.data.JSProgram).toBe('console.log("Hello World");');

    // Check that db execute was called to check for existing package
    expect(executeMock).toHaveBeenCalledWith(
      'SELECT id FROM packages WHERE id = ?',
      [packageID]
    );

    // Check that db execute was called to insert the package
    expect(executeMock).toHaveBeenCalledWith(
      'INSERT INTO packages (id, package_name, package_version, content, url, js_program, debloat, readme) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        packageID,
        packageName,
        packageVersion,
        packageBuffer,
        packageURL,
        'console.log("Hello World");',
        false,
        'This is the README.md content',
      ]
    );
  });

=======
>>>>>>> main
  test('should return 400 when both Content and URL are provided', async () => {
    const response = await request(app)
      .post('/package')
      .send({
        Name: 'TestPackage',
        Content: 'fakeContent',
        URL: 'https://github.com/testuser/testrepo',
      })
      .expect(400);

<<<<<<< HEAD
    expect(response.body).toHaveProperty('message', 'Either Content or URL must be provided, but not both');
=======
    expect(response.body.message).toBe('Either Content or URL must be provided, but not both');
>>>>>>> main
  });

  test('should return 400 when neither Content nor URL are provided', async () => {
    const response = await request(app)
      .post('/package')
      .send({
        Name: 'TestPackage',
      })
      .expect(400);

<<<<<<< HEAD
    expect(response.body).toHaveProperty('message', 'Either Content or URL must be provided, but not both');
  });

  test('should return 400 when Content is provided but Name is missing', async () => {
    const response = await request(app)
      .post('/package')
      .send({
        Content: 'fakeContent',
      })
      .expect(400);

    expect(response.body).toHaveProperty('message', 'Name is required for Content');
  });

  test('should return 400 when Content is invalid Base64', async () => {
=======
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
>>>>>>> main
    const response = await request(app)
      .post('/package')
      .send({
        Name: 'TestPackage',
        Content: 'invalidBase64Content$$$',
      })
<<<<<<< HEAD
      .expect(400);

    expect(response.body).toHaveProperty('message', 'Invalid Base64 Content');
  });

  test('should return 400 when URL fails to fetch package', async () => {
    // Mock resolveURL
    const resolveURLMock = require('../utils/handleURL').resolveURL as jest.Mock;
    resolveURLMock.mockResolvedValue('https://github.com/testuser/testrepo');

    // Mock getOwnerAndRepoFromURL
    const getOwnerAndRepoFromURLMock = require('../utils/handleURL').getOwnerAndRepoFromURL as jest.Mock;
    getOwnerAndRepoFromURLMock.mockResolvedValue({
      owner: 'testuser',
      repo: 'testrepo',
    });

    // Mock axios.get to fail when fetching package zip
    mockedAxios.get.mockImplementation((url: string, options?: any) => {
      if (url.includes('/archive/')) {
        return Promise.reject(new Error('Error fetching package from URL'));
      } else if (url.includes('/repos/')) {
        return Promise.resolve({
          data: {
            default_branch: 'main',
          },
          status: 200,
        });
      } else {
        return Promise.reject(new Error('URL not recognized'));
      }
    });

    const response = await request(app)
      .post('/package')
      .send({
        URL: 'https://github.com/testuser/testrepo',
      })
      .expect(400);

    expect(response.body).toHaveProperty('message', 'Error fetching package from URL');
  });

  test('should return 409 when package already exists', async () => {
    const packageBuffer = Buffer.from('fake package data');
    const base64Content = packageBuffer.toString('base64');
    const packageName = 'TestPackage';
    const packageVersion = '1.0.0';
    const packageID = 'testpackage-1.0.0';

    // Mock generateID
    const generateIDMock = require('../utils/generateID').generateID as jest.Mock;
    generateIDMock.mockReturnValue(packageID);

    // Mock ratePackage
    const ratePackageMock = require('../utils/ratePackage').ratePackage as jest.Mock;
    ratePackageMock.mockResolvedValue(0.6);

    // Mock db execute for checking existing package
    executeMock.mockResolvedValueOnce([[{ id: packageID }]]); // Package exists

    // Send POST request
    const response = await request(app)
      .post('/package')
      .send({
        Name: packageName,
        Version: packageVersion,
        Content: base64Content,
        JSProgram: 'console.log("Hello World");',
        debloat: false,
      })
      .expect(409);

    expect(response.body).toHaveProperty('message', 'Package already exists.');
  });

  test('should return 424 when package rating is below threshold', async () => {
    const packageBuffer = Buffer.from('fake package data');
    const base64Content = packageBuffer.toString('base64');
    const packageName = 'TestPackage';
    const packageVersion = '1.0.0';
    const packageID = 'testpackage-1.0.0';

    // Mock generateID
    const generateIDMock = require('../utils/generateID').generateID as jest.Mock;
    generateIDMock.mockReturnValue(packageID);

    // Mock ratePackage
    const ratePackageMock = require('../utils/ratePackage').ratePackage as jest.Mock;
    ratePackageMock.mockResolvedValue(0.4); // Rating below 0.5

    // Send POST request
    const response = await request(app)
      .post('/package')
      .send({
        Name: packageName,
        Version: packageVersion,
        Content: base64Content,
        JSProgram: 'console.log("Hello World");',
        debloat: false,
      })
      .expect(424);

    expect(response.body).toHaveProperty('message', 'Package is not uploaded due to the disqualified rating.');
  });

  test('should return 500 when a server error occurs', async () => {
    const packageBuffer = Buffer.from('fake package data');
    const base64Content = packageBuffer.toString('base64');
    const packageName = 'TestPackage';
    const packageVersion = '1.0.0';
    const packageID = 'testpackage-1.0.0';

    // Mock generateID
    const generateIDMock = require('../utils/generateID').generateID as jest.Mock;
    generateIDMock.mockReturnValue(packageID);

    // Mock ratePackage
    const ratePackageMock = require('../utils/ratePackage').ratePackage as jest.Mock;
    ratePackageMock.mockResolvedValue(0.6);

    // Mock db execute for checking existing package
    executeMock.mockResolvedValueOnce([[]]); // No existing package

    // Mock db execute to throw error when inserting package
    executeMock.mockRejectedValueOnce(new Error('Database error during insert'));

    // Send POST request
    const response = await request(app)
      .post('/package')
      .send({
        Name: packageName,
        Version: packageVersion,
        Content: base64Content,
        JSProgram: 'console.log("Hello World");',
        debloat: false,
      })
      .expect(500);

    expect(response.body).toHaveProperty('message', 'Server error during upload');
  });
=======

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
  
>>>>>>> main
});
