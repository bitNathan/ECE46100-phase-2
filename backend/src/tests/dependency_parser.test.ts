// dependency_parser.test.ts
import { getDependencies, Dependency } from '../dependency_parser';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Dependency Parser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should parse dependencies correctly from package.json', async () => {
    // Mock successful API response
    const mockPackageJson = {
      dependencies: {
        'react': '^17.0.2',
        'lodash': '4.17.21',
        'axios': '~0.21.1'
      }
    };

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        content: Buffer.from(JSON.stringify(mockPackageJson)).toString('base64'),
        encoding: 'base64'
      }
    });

    const dependencies = await getDependencies('owner', 'repo');

    expect(dependencies).toEqual([
      { name: 'react', version: '^17.0.2' },
      { name: 'lodash', version: '4.17.21' },
      { name: 'axios', version: '~0.21.1' }
    ]);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.github.com/repos/owner/repo/contents/package.json'
    );
  });

  it('should handle package.json without dependencies', async () => {
    const mockPackageJson = {
      name: 'test-package'
    };

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        content: Buffer.from(JSON.stringify(mockPackageJson)).toString('base64'),
        encoding: 'base64'
      }
    });

    const dependencies = await getDependencies('owner', 'repo');
    expect(dependencies).toEqual([]);
  });

  it('should handle invalid version types in dependencies', async () => {
    const mockPackageJson = {
      dependencies: {
        'valid-dep': '1.0.0',
        'invalid-dep': { invalid: 'type' },
        'null-dep': null
      }
    };

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        content: Buffer.from(JSON.stringify(mockPackageJson)).toString('base64'),
        encoding: 'base64'
      }
    });

    const dependencies = await getDependencies('owner', 'repo');
    expect(dependencies).toEqual([
      { name: 'valid-dep', version: '1.0.0' }
    ]);
  });

  it('should handle API request failure', async () => {
    const mockError = new Error('API Error');
    mockedAxios.get.mockRejectedValueOnce(mockError);

    const dependencies = await getDependencies('owner', 'repo');
    expect(dependencies).toEqual([]);
  });

  it('should handle Axios error with response', async () => {
    const mockAxiosError = {
      isAxiosError: true,
      response: {
        status: 404,
        data: 'Not Found'
      },
      message: 'Request failed with status code 404'
    };
    mockedAxios.get.mockRejectedValueOnce(mockAxiosError);

    const dependencies = await getDependencies('owner', 'repo');
    expect(dependencies).toEqual([]);
  });

  it('should handle malformed JSON in package.json', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        content: Buffer.from('invalid json').toString('base64'),
        encoding: 'base64'
      }
    });

    const dependencies = await getDependencies('owner', 'repo');
    expect(dependencies).toEqual([]);
  });

  it('should handle empty package.json', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        content: Buffer.from('{}').toString('base64'),
        encoding: 'base64'
      }
    });

    const dependencies = await getDependencies('owner', 'repo');
    expect(dependencies).toEqual([]);
  });
});