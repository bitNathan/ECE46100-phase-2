// rate_metrics.test.ts
import { calculateRateMetrics } from '../metrics/rate_metrics';
import { getPullRequestCodeReview } from '../metrics/pull_request_code_review';
import { getDependencies } from '../dependency_parser';

// Mock all dependencies
jest.mock('../metrics/pull_request_code_review');
jest.mock('../dependency_parser');

describe('Rate Metrics Calculation', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (getPullRequestCodeReview as jest.Mock).mockResolvedValue(0.5);
    (getDependencies as jest.Mock).mockResolvedValue([
      { name: 'dep1', version: '1.0.0' },
      { name: 'dep2', version: '^2.0.0' }
    ]);
  });

  it('should calculate metrics correctly', async () => {
    // Setup specific mock values for this test
    (getDependencies as jest.Mock).mockResolvedValueOnce([
      { name: 'dep1', version: '1.0.0' },
      { name: 'dep2', version: '^2.0.0' }
    ]);
    (getPullRequestCodeReview as jest.Mock).mockResolvedValueOnce(0.5);

    const result = await calculateRateMetrics('mockOwner', 'mockRepo');
    
    // Verify the dependencies were called
    expect(getDependencies).toHaveBeenCalledWith('mockOwner', 'mockRepo');
    expect(getPullRequestCodeReview).toHaveBeenCalledWith('mockOwner', 'mockRepo');

    // Check the results
    expect(result).toBeDefined();
    expect(result.subScores.pullRequestFraction).toBeCloseTo(0.5, 4);
    expect(result.subScores.dependencyPinning).toBeCloseTo(0.5, 4);
    expect(result.netScore).toBeCloseTo(0.5, 4);
  });

  it('should handle the case with no dependencies and no reviewed code', async () => {
    // Mock for empty dependencies
    (getDependencies as jest.Mock).mockResolvedValueOnce([]);
    (getPullRequestCodeReview as jest.Mock).mockResolvedValueOnce(0);

    const result = await calculateRateMetrics('mockOwner', 'mockRepo');

    expect(result).toBeDefined();
    expect(result.subScores.pullRequestFraction).toBe(0);
    expect(result.subScores.dependencyPinning).toBe(1.0);
    expect(result.netScore).toBeCloseTo(0.5, 4);
  });
  //
  it('should handle different version formats correctly', async () => {
    (getDependencies as jest.Mock).mockResolvedValueOnce([
      { name: 'dep1', version: '2.3.x' },    // Valid - pinned to major.minor
      { name: 'dep2', version: '2.3.*' },    // Valid - pinned to major.minor
      { name: 'dep3', version: '2.3' },      // Valid - major.minor only
      { name: 'dep4', version: '2.3.4' },    // Valid - fully pinned
      { name: 'dep5', version: '^2.3.4' },   // Invalid - uses ^
      { name: 'dep6', version: '~2.3.4' }    // Invalid - uses ~
    ]);
    
    const result = await calculateRateMetrics('mockOwner', 'mockRepo');
    expect(result.subScores.dependencyPinning).toBeCloseTo(2 / 6, 4); // 
  });
});