import { packageRateHandler } from '../routes/packageRate';

// Mock the database connection
jest.mock('../routes/db', () => ({
  __esModule: true,
  default: Promise.resolve({
    execute: jest.fn()
  })
}));

<<<<<<< HEAD
// Mock all dependency functions
=======
// Mock all metric functions
>>>>>>> main
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

<<<<<<< HEAD
jest.mock('../metrics/pull_request_code_review', () => ({
  getPullRequestCodeReview: jest.fn().mockResolvedValue([0.75, 0.1])
=======
jest.mock('../metrics/dependency_pinning', () => ({
  calculateDependencyPinning: jest.fn().mockResolvedValue([0.95, 0.1])
>>>>>>> main
}));

jest.mock('../metrics/pull_request_code_review', () => ({
  getPullRequestCodeReview: jest.fn().mockResolvedValue([0.75, 0.1])
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

  it('should return 500 if the database connection fails', async () => {
    jest.mock('../routes/db', () => ({
      __esModule: true,
      default: Promise.reject(new Error('Database connection error'))
    }));

    const response = await packageRateHandler('123');
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Internal server error'); // Update to match actual implementation
  });

  it('should return 500 if a metric calculation fails', async () => {
    const mockPackage = {
      id: '123',
      url: 'https://github.com/test/repo'
    };

    mockDb.execute.mockResolvedValueOnce([[mockPackage]]);
    const getBusFactorMock = require('../metrics/bus_factor').getBusFactor;
    getBusFactorMock.mockRejectedValueOnce(new Error('Metric calculation failed'));

    const response = await packageRateHandler('123');
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Rating system failed'); // Update to match actual implementation
  });

  it('should return 200 with the calculated package rating', async () => {
    const mockPackage = {
      id: '123',
      url: 'https://github.com/test/repo'
    };

    mockDb.execute.mockResolvedValueOnce([[mockPackage]]);

    const response = await packageRateHandler('123');
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    const expectedMetrics = [
      'BusFactor',
      'Correctness',
      'RampUp',
      'ResponsiveMaintainer',
      'LicenseScore',
      'GoodPinningPractice',
      'PullRequest',
      'NetScore',
      'RampUpLatency',
      'CorrectnessLatency',
      'BusFactorLatency',
      'ResponsiveMaintainerLatency',
      'LicenseScoreLatency',
      'GoodPinningPracticeLatency',
      'PullRequestLatency',
      'NetScoreLatency'
    ];

    expectedMetrics.forEach((metric) => {
      expect(body).toHaveProperty(metric);
      expect(typeof body[metric]).toBe('number');
    });

    const calculatedNetScore =
      (0.7 * 0.2) + // RampUp
      (0.9 * 0.2) + // Correctness
      (0.8 * 0.1) + // BusFactor
      (0.85 * 0.2) + // ResponsiveMaintainer
      (1.0 * 0.1) + // LicenseScore
      (0.95 * 0.1) + // GoodPinningPractice
      (0.75 * 0.1); // PullRequest

    expect(body.NetScore).toBeCloseTo(calculatedNetScore, 2);
  });
<<<<<<< HEAD

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
=======
});
>>>>>>> main
