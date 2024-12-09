import { packageRateHandler } from '../routes/packageRate';

// Mock the database connection
jest.mock('../routes/db', () => ({
  __esModule: true,
  default: Promise.resolve({
    execute: jest.fn()
  })
}));

// Mock all dependency functions
jest.mock('../metrics/bus_factor', () => ({
  getBusFactor: jest.fn().mockResolvedValue([0.8, 0.1])
}));

jest.mock('../metrics/correctness', () => ({
  getCorrectness: jest.fn().mockResolvedValue([0.9, 0.1])
}));

jest.mock('../metrics/ramp_up_metric', () => ({
  calculateTotalTimeFromRepo: jest.fn().mockResolvedValue([0.7, 0.1])
}));

jest.mock('../metrics/responsive_maintainer', () => ({
  getResponsive: jest.fn().mockResolvedValue([0.85, 0.1])
}));

jest.mock('../metrics/license', () => ({
  getLicense: jest.fn().mockResolvedValue([1.0, 0.1])
}));

jest.mock('../metrics/pull_request_code_review', () => ({
  getPullRequestCodeReview: jest.fn().mockResolvedValue([0.75, 0.1])
}));

jest.mock('../dependency_parser', () => ({
  getDependencies: jest.fn().mockResolvedValue([
    { name: 'dep1', version: '1.0.0' }
  ])
}));

jest.mock('../url_parse', () => ({
  parseURL: jest.fn().mockResolvedValue(['testOwner', 'testRepo'])
}));

describe('packageRateHandler', () => {
  let mockDb: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDb = await (jest.requireMock('../routes/db').default);
  });

  // Test 404 - Package Not Found
  it('should return 404 if package does not exist', async () => {
    mockDb.execute.mockResolvedValueOnce([[]]);
    
    const response = await packageRateHandler('123');
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).error).toBe('Package does not exist');
  });

  // Test 200 - Successful Rating
  it('should return 200 with complete package rating', async () => {
    const mockPackage = {
      id: '123',
      name: 'test-package',
      version: '1.0.0',
      url: 'https://github.com/test/repo'
    };

    mockDb.execute.mockResolvedValueOnce([[mockPackage]]);

    const response = await packageRateHandler('123');
    console.log('Response:', response);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    console.log('Response body:', body);

    const requiredMetrics = [
      'RampUp',
      'Correctness',
      'BusFactor',
      'ResponsiveMaintainer',
      'LicenseScore',
      'GoodPinningPractice',
      'PullRequest',
      'NetScore'
    ];

    requiredMetrics.forEach(metric => {
      expect(body).toHaveProperty(metric);
      expect(typeof body[metric]).toBe('number');
      expect(body[metric]).toBeGreaterThanOrEqual(0);
      expect(body[metric]).toBeLessThanOrEqual(1);

      const latencyField = `${metric}Latency`;
      expect(body).toHaveProperty(latencyField);
      expect(typeof body[latencyField]).toBe('number');
      expect(body[latencyField]).toBeGreaterThanOrEqual(0);
    });
  });

  // Test 500 - Rating System Error
  it('should return 500 if rating calculation fails', async () => {
    const mockPackage = {
      id: '123',
      name: 'test-package',
      version: '1.0.0',
      url: 'https://github.com/test/repo'
    };

    mockDb.execute.mockResolvedValueOnce([[mockPackage]]);

    // Mock bus factor calculation to fail
    const busFactorMock = require('../metrics/bus_factor').getBusFactor;
    busFactorMock.mockRejectedValueOnce(new Error('Rating calculation failed'));

    const response = await packageRateHandler('123');
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Rating system failed');
  });

  // Test invalid URL
  it('should return 500 if URL is invalid', async () => {
    const mockPackage = {
      id: '123',
      name: 'test-package',
      version: '1.0.0',
      url: 'invalid-url'
    };

    mockDb.execute.mockResolvedValueOnce([[mockPackage]]);

    // Mock URL parsing to fail
    const parseURLMock = require('../url_parse').parseURL;
    parseURLMock.mockResolvedValueOnce([null, null]);

    const response = await packageRateHandler('123');
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Invalid repository URL');
  });
});