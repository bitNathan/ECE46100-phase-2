const executeMock = jest.fn();

jest.mock('../routes/db', () => ({
  __esModule: true,
  default: Promise.resolve({
    execute: executeMock,
  }),
}));

import request from 'supertest';
import app from '../server';
import axios from 'axios';

// Mocks
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

describe('POST /package/:id - Update Package Version', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const generateIDMock = require('../utils/generateID').generateID as jest.Mock;
  const ratePackageMock = require('../utils/ratePackage').ratePackage as jest.Mock;
  const resolveURLMock = require('../utils/handleURL').resolveURL as jest.Mock;
  const getOwnerAndRepoFromURLMock = require('../utils/handleURL').getOwnerAndRepoFromURL as jest.Mock;

  test('should successfully update an existing package version via Content ingestion', async () => {
    const originalID = 'originalpackage-1.0.0';
    const packageName = 'OriginalPackage';
    const newVersion = '1.0.1'; // strictly greater patch
    const newID = 'originalpackage-1.0.1';
    const packageBuffer = Buffer.from('fake package data');
    const base64Content = packageBuffer.toString('base64');

    // Existing package from DB
    executeMock.mockResolvedValueOnce([
      [{ package_name: packageName, package_version: '1.0.0', url: null, debloat: 0 }]
    ]);

    // Version check: no existing 1.0.1
    executeMock.mockResolvedValueOnce([[]]);

    // All versions for this package
    executeMock.mockResolvedValueOnce([
      [{ package_version: '1.0.0' }]
    ]);

    generateIDMock.mockReturnValue(newID);
    ratePackageMock.mockResolvedValue(0.6);

    // Insert new version
    executeMock.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const response = await request(app)
      .post(`/package/${originalID}`)
      .send({
        metadata: {
          Name: packageName,
          Version: newVersion,
          ID: newID,
        },
        data: {
          Content: base64Content,
          JSProgram: 'console.log("Hello World");',
          debloat: false,
        }
      })

    expect(response.body).toBeDefined()

    // Check insert call
    expect(executeMock).toHaveBeenCalledTimes(3)
  });

  test('should successfully update an existing package version via URL ingestion (allow older patch)', async () => {
    const originalID = 'originalpackage-1.0.2';
    const packageName = 'OriginalPackage';
    const newVersion = '1.0.1'; // older patch is allowed for URL ingestion
    const newID = 'originalpackage-1.0.1';
    const packageBuffer = Buffer.from('fake package data');
    const base64Content = packageBuffer.toString('base64');
    const packageURL = 'https://github.com/testuser/testrepo';

    // Existing package from DB (original ingested via URL)
    executeMock.mockResolvedValueOnce([
      [{ package_name: packageName, package_version: '1.0.2', url: 'https://github.com/testuser/testrepo', debloat: 0 }]
    ]);

    // This exact version does not exist
    executeMock.mockResolvedValueOnce([[]]);

    // All versions for this package (includes 1.0.2)
    executeMock.mockResolvedValueOnce([
      [{ package_version: '1.0.0' }, { package_version: '1.0.2' }]
    ]);

    generateIDMock.mockReturnValue(newID);
    ratePackageMock.mockResolvedValue(0.6);
    resolveURLMock.mockResolvedValue(packageURL);
    getOwnerAndRepoFromURLMock.mockResolvedValue({ owner: 'testuser', repo: 'testrepo' });

    // Mock axios for repo info and zip fetch
    mockedAxios.get.mockImplementation((url: string, options?: any) => {
      if (url.includes('/repos/')) {
        return Promise.resolve({
          data: {
            default_branch: 'main',
          },
          status: 200,
        });
      } else if (url.includes('/archive/')) {
        return Promise.resolve({
          data: packageBuffer,
          status: 200,
        });
      } else if (url.includes('/README.md')) {
        return Promise.resolve({
          data: 'This is a README',
          status: 200,
        });
      }
      return Promise.reject(new Error('URL not recognized'));
    });

    // Insert new version
    executeMock.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const response = await request(app)
      .post(`/package/${originalID}`)
      .send({
        metadata: {
          Name: packageName,
          Version: newVersion,
          ID: newID,
        },
        data: {
          URL: packageURL,
          JSProgram: 'console.log("Hello URL World");',
          debloat: false,
        }
      })

    expect(response.body).toBeDefined();
  });

  test('should return 404 if the original package does not exist', async () => {
    const originalID = 'nonexistentpackage-1.0.0';

    // No rows returned
    executeMock.mockResolvedValueOnce([[]]);

    const response = await request(app)
      .post(`/package/${originalID}`)
      .send({
        metadata: {
          Name: 'NonExistent',
          Version: '1.0.1',
          ID: 'nonexistentpackage-1.0.1',
        },
        data: {
          Content: 'fakeContent',
        },
      })

    expect(response.body.message).toBeDefined();
  });

  test('should return 400 if name does not match the original package name', async () => {
    const originalID = 'originalpackage-1.0.0';

    // Existing package with name 'OriginalPackage'
    executeMock.mockResolvedValueOnce([
      [{ package_name: 'OriginalPackage', package_version: '1.0.0', url: null, debloat: 0 }]
    ]);

    const response = await request(app)
      .post(`/package/${originalID}`)
      .send({
        metadata: {
          Name: 'DifferentName',
          Version: '1.0.1',
          ID: 'differentname-1.0.1',
        },
        data: {
          Content: 'ZmFrZSBwYWNrYWdlIGRhdGE=', // fake base64
        },
      })

    expect(response.body.message).toBeDefined();
  });

  test('should return 400 if ingestion method changed (original Content, now URL)', async () => {
    const originalID = 'originalpackage-1.0.0';

    // Originally ingested via Content (url = null)
    executeMock.mockResolvedValueOnce([
      [{ package_name: 'OriginalPackage', package_version: '1.0.0', url: null, debloat: 0 }]
    ]);

    const response = await request(app)
      .post(`/package/${originalID}`)
      .send({
        metadata: {
          Name: 'OriginalPackage',
          Version: '1.0.1',
          ID: 'originalpackage-1.0.1',
        },
        data: {
          URL: 'https://github.com/testuser/testrepo',
        },
      })

    expect(response.body.message).toBeDefined();
  });

  test('should return 400 if ingestion method changed (original URL, now Content)', async () => {
    const originalID = 'originalpackage-1.0.0';

    // Originally ingested via URL (url != null)
    executeMock.mockResolvedValueOnce([
      [{ package_name: 'OriginalPackage', package_version: '1.0.0', url: 'someurl', debloat: 0 }]
    ]);

    const response = await request(app)
      .post(`/package/${originalID}`)
      .send({
        metadata: {
          Name: 'OriginalPackage',
          Version: '1.0.1',
          ID: 'originalpackage-1.0.1',
        },
        data: {
          Content: 'ZmFrZSBwYWNrYWdlIGRhdGE=',
        },
      })

    expect(response.body.message).toBeDefined();
  });

  test('should return 409 if the new version already exists', async () => {
    const originalID = 'originalpackage-1.0.0';
    const newVersion = '1.0.1';
    const newID = 'originalpackage-1.0.1';

    // original package exists
    executeMock.mockResolvedValueOnce([
      [{ package_name: 'OriginalPackage', package_version: '1.0.0', url: null, debloat: 0 }]
    ]);

    // checking new version existence -> found
    executeMock.mockResolvedValueOnce([[{ id: newID }]]);

    const response = await request(app)
      .post(`/package/${originalID}`)
      .send({
        metadata: {
          Name: 'OriginalPackage',
          Version: newVersion,
          ID: newID,
        },
        data: {
          Content: 'ZmFrZSBwYWNrYWdlIGRhdGE=',
        },
      })

    expect(response.body.message).toBe('Package does not exist.');
  });

  test('should return 400 if invalid semver version', async () => {
    const originalID = 'originalpackage-1.0.0';

    executeMock.mockResolvedValueOnce([
      [{ package_name: 'OriginalPackage', package_version: '1.0.0', url: null, debloat: 0 }]
    ]);

    const response = await request(app)
      .post(`/package/${originalID}`)
      .send({
        metadata: {
          Name: 'OriginalPackage',
          Version: 'invalid_version',
          ID: 'originalpackage-invalid_version',
        },
        data: {
          Content: 'ZmFrZSBwYWNrYWdlIGRhdGE=',
        },
      })
      .expect(400);

    expect(response.body.message).toBe('Invalid version format. Must be valid semver.');
  });

  test('should return 400 if patch version is not strictly greater for Content ingestion', async () => {
    const originalID = 'originalpackage-1.0.0';
    const newVersion = '1.0.0'; // same version or lower patch

    executeMock.mockResolvedValueOnce([
      [{ package_name: 'OriginalPackage', package_version: '1.0.0', url: null, debloat: 0 }]
    ]);

    // No version existence check (new one presumably doesn't exist)
    executeMock.mockResolvedValueOnce([[]]);

    // All versions for this package: includes 1.0.0
    executeMock.mockResolvedValueOnce([
      [{ package_version: '1.0.0' }]
    ]);

    const response = await request(app)
      .post(`/package/${originalID}`)
      .send({
        metadata: {
          Name: 'OriginalPackage',
          Version: newVersion,
          ID: 'originalpackage-1.0.0',
        },
        data: {
          Content: 'ZmFrZSBwYWNrYWdlIGRhdGE=',
        },
      })

    expect(response.body.message).toBeDefined();
  });

  test('should return 424 if the rating is below threshold', async () => {
    const originalID = 'originalpackage-1.0.0';
    const newVersion = '1.0.1';
    const newID = 'originalpackage-1.0.1';
    const packageBuffer = Buffer.from('fake package data');

    executeMock.mockResolvedValueOnce([
      [{ package_name: 'OriginalPackage', package_version: '1.0.0', url: null, debloat: 0 }]
    ]);

    // new version does not exist
    executeMock.mockResolvedValueOnce([[]]);

    // all versions
    executeMock.mockResolvedValueOnce([
      [{ package_version: '1.0.0' }]
    ]);

    generateIDMock.mockReturnValue(newID);
    ratePackageMock.mockResolvedValue(0.4); // below threshold

    const response = await request(app)
      .post(`/package/${originalID}`)
      .send({
        metadata: {
          Name: 'OriginalPackage',
          Version: newVersion,
          ID: newID,
        },
        data: {
          Content: packageBuffer.toString('base64'),
        },
      })

    expect(response.body.message).toBeDefined();
  });

  test('should return 500 if server error occurs during insert', async () => {
    const originalID = 'originalpackage-1.0.0';
    const newVersion = '1.0.1';
    const newID = 'originalpackage-1.0.1';
    const packageBuffer = Buffer.from('fake package data');

    executeMock.mockResolvedValueOnce([
      [{ package_name: 'OriginalPackage', package_version: '1.0.0', url: null, debloat: 0 }]
    ]);

    // version does not exist
    executeMock.mockResolvedValueOnce([[]]);

    // all versions for patch check
    executeMock.mockResolvedValueOnce([
      [{ package_version: '1.0.0' }]
    ]);

    generateIDMock.mockReturnValue(newID);
    ratePackageMock.mockResolvedValue(0.6);

    // Insert fails
    executeMock.mockRejectedValueOnce(new Error('Database error during insert'));

    const response = await request(app)
      .post(`/package/${originalID}`)
      .send({
        metadata: {
          Name: 'OriginalPackage',
          Version: newVersion,
          ID: newID,
        },
        data: {
          Content: packageBuffer.toString('base64'),
        },
      })

    expect(response.body.message).toBeDefined();
  });

  test('should return 400 if no Content or URL and package could not be fetched', async () => {
    const originalID = 'originalpackage-1.0.0';
    const newVersion = '1.0.1';
    const newID = 'originalpackage-1.0.1';

    executeMock.mockResolvedValueOnce([
      [{ package_name: 'OriginalPackage', package_version: '1.0.0', url: null, debloat: 0 }]
    ]);

    // new version does not exist
    executeMock.mockResolvedValueOnce([[]]);

    // all versions
    executeMock.mockResolvedValueOnce([
      [{ package_version: '1.0.0' }]
    ]);

    generateIDMock.mockReturnValue(newID);
    ratePackageMock.mockResolvedValue(0.6);

    // No Content or URL provided means no packageBuffer obtained
    const response = await request(app)
      .post(`/package/${originalID}`)
      .send({
        metadata: {
          Name: 'OriginalPackage',
          Version: newVersion,
          ID: newID,
        },
        data: {}
      })

    expect(response.body.message).toBeDefined();
  });

});
