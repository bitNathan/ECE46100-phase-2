// rate_metrics.test.ts
import { calculateRateMetrics } from '../metrics/rate_metrics';
import { getPullRequestCodeReview } from '../metrics/pull_request_code_review';
import { getDependencies } from '../dependency_parser';
import { getBusFactor } from '../metrics/bus_factor';
import { getCorrectness } from '../metrics/correctness';
import { calculateTotalTimeFromRepo } from '../metrics/ramp_up_metric';
import { getResponsive } from '../metrics/responsive_maintainer';
import { getLicense } from '../metrics/license';

// Mock all dependencies
jest.mock('../metrics/pull_request_code_review');
jest.mock('../dependency_parser');
jest.mock('../bus_factor');
jest.mock('../correctness');
jest.mock('../ramp_up_metric');
jest.mock('../responsive_maintainer');
jest.mock('../license');

describe('Rate Metrics Calculation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (getBusFactor as jest.Mock).mockResolvedValue([0.8, 0.1]);
    (getCorrectness as jest.Mock).mockResolvedValue([0.9, 0.1]);
    (calculateTotalTimeFromRepo as jest.Mock).mockResolvedValue([0.7, 0.1]);
    (getResponsive as jest.Mock).mockResolvedValue([0.85, 0.1]);
    (getLicense as jest.Mock).mockResolvedValue([1.0, 0.1]);
    (getPullRequestCodeReview as jest.Mock).mockResolvedValue([0.5, 0.1]);
    (getDependencies as jest.Mock).mockResolvedValue([
      { name: 'dep1', version: '1.0.0' },
      { name: 'dep2', version: '^2.0.0' }
    ]);
  });

  it('should calculate metrics correctly', async () => {
    const mockPackageData = {
      id: '123',
      name: 'test-package',
      version: '1.0.0',
      url: 'https://github.com/test/repo'
    };

    const result = await calculateRateMetrics(mockPackageData);

    expect(result).toBeDefined();
    expect(result.RampUp).toBeGreaterThanOrEqual(0);
    expect(result.Correctness).toBeGreaterThanOrEqual(0);
    expect(result.BusFactor).toBeGreaterThanOrEqual(0);
    expect(result.ResponsiveMaintainer).toBeGreaterThanOrEqual(0);
    expect(result.LicenseScore).toBeGreaterThanOrEqual(0);
    expect(result.GoodPinningPractice).toBeGreaterThanOrEqual(0);
    expect(result.PullRequest).toBeGreaterThanOrEqual(0);
    expect(result.NetScore).toBeGreaterThanOrEqual(0);

    // Check latencies
    expect(result.RampUpLatency).toBeGreaterThanOrEqual(0);
    expect(result.CorrectnessLatency).toBeGreaterThanOrEqual(0);
    expect(result.BusFactorLatency).toBeGreaterThanOrEqual(0);
    expect(result.ResponsiveMaintainerLatency).toBeGreaterThanOrEqual(0);
    expect(result.LicenseScoreLatency).toBeGreaterThanOrEqual(0);
    expect(result.GoodPinningPracticeLatency).toBeGreaterThanOrEqual(0);
    expect(result.PullRequestLatency).toBeGreaterThanOrEqual(0);
    expect(result.NetScoreLatency).toBeGreaterThanOrEqual(0);
  });

  it('should handle failed metrics', async () => {
    const mockPackageData = {
      id: '123',
      name: 'test-package',
      version: '1.0.0',
      url: 'https://github.com/test/repo'
    };

    (getBusFactor as jest.Mock).mockResolvedValue([-1, 0]);

    const result = await calculateRateMetrics(mockPackageData);
    expect(result.BusFactor).toBe(-1);
    expect(result.NetScore).toBe(-1);
  });
});