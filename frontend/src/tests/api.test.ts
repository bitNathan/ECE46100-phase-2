import axios from 'axios';
import * as api from '../services/api';

// Mock the axios module
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Service Tests', () => {
  const mockResponseData = { data: 'mocked data' };

  beforeEach(() => {
    mockedAxios.post.mockClear();
    mockedAxios.get.mockClear();
    mockedAxios.delete.mockClear();
  });

  test('getPackages calls API with correct parameters', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: mockResponseData });
  
    const result = await api.getPackages(1);
  
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/packages',
      [{"Name": "*", "Version": "*"}], // Correct payload
      { params: { offset: 1 } } // Correct params
    );
    expect(result).toEqual(mockResponseData);
  });

  test('fetchPackageVersion sends correct payload', async () => {
    const mockPayload = { packageId: '123', version: '1.0.0' };
    mockedAxios.post.mockResolvedValueOnce({ data: mockResponseData });

    const result = await api.fetchPackageVersion(mockPayload.packageId, mockPayload.version);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/packages',
      mockPayload
    );
    expect(result).toEqual(mockResponseData);
  });

  test('uploadPackage sends content correctly', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: {} });

    await api.uploadPackage('test-package', 'base64Content', null, false, 'test.js');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/package',
      {
        Name: 'test-package',
        debloat: false,
        JSProgram: 'test.js',
        Content: 'base64Content',
      }
    );
  });

  test('updatePackage sends correct payload', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: {} });

    const payload = {
      packageId: '123',
      version: '1.0.1',
      content: 'new content',
      url: null,
      name: 'updated-package',
      jsProgram: 'updated.js',
      debloat: true,
    };

    await api.updatePackage(
      payload.packageId,
      payload.version,
      payload.content,
      payload.url,
      payload.name,
      payload.jsProgram,
      payload.debloat
    );

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `http://localhost:3000/package/${payload.packageId}`,
      {
        metadata: {
          Name: payload.name,
          Version: payload.version,
          ID: payload.packageId,
        },
        data: {
          Name: payload.name,
          Content: payload.content,
          JSProgram: payload.jsProgram,
          debloat: payload.debloat,
        },
      }
    );
  });

  test('downloadPackage calls API with correct ID', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockResponseData });

    const result = await api.downloadPackage('abc123');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://localhost:3000/package/abc123'
    );
    expect(result).toEqual(mockResponseData);
  });

  test('getPackagesByRegEx sends regex payload', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: mockResponseData });

    const regex = '.*test.*';
    const result = await api.getPackagesByRegEx(regex);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/package/byRegEx',
      { regex }
    );
    expect(result).toEqual(mockResponseData);
  });

  test('recommendPackages sends description payload', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: mockResponseData });

    const description = 'A test project description';
    const result = await api.recommendPackages(description);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/recommend',
      { description }
    );
    expect(result).toEqual(mockResponseData);
  });

  test('getPlannedTracks calls the correct endpoint', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: ['Track1', 'Track2'] });

    const result = await api.getPlannedTracks();

    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3000/tracks');
    expect(result).toEqual(['Track1', 'Track2']);
  });

  test('resetRegistry calls reset endpoint', async () => {
    mockedAxios.delete.mockResolvedValueOnce({}); // Use delete here

    await api.resetRegistry();

    expect(mockedAxios.delete).toHaveBeenCalledWith('http://localhost:3000/reset'); // Updated to mockedAxios.delete
  });
});
