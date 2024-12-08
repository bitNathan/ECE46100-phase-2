import { calculateDependencyPinning } from '../metrics/dependency_pinning';
import { getDependencies } from '../dependency_parser';

jest.mock('../dependency_parser');

describe('Dependency Pinning Metric', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the correct fraction of pinned dependencies', async () => {
    (getDependencies as jest.Mock).mockResolvedValue([
      { name: 'dep1', version: '2.3.4' }, // Pinned
      { name: 'dep2', version: '2.4.x' }, // Not pinned
      { name: 'dep3', version: '3.0.0' }, // Pinned
    ]);

    const [score, latency] = await calculateDependencyPinning('mockOwner', 'mockRepo');
    expect(score).toBeCloseTo(0.67, 2); // Two pinned out of three dependencies
    expect(latency).toBeGreaterThanOrEqual(0);
  });

  it('should return 0 when no dependencies are pinned', async () => {
    (getDependencies as jest.Mock).mockResolvedValue([
      { name: 'dep1', version: '2.x' }, // Not pinned
      { name: 'dep2', version: '3.x' }, // Not pinned
    ]);

    const [score, latency] = await calculateDependencyPinning('mockOwner', 'mockRepo');
    expect(score).toBe(0); // No pinned dependencies
    expect(latency).toBeGreaterThanOrEqual(0);
  });

  it('should return 1 when there are no dependencies', async () => {
    (getDependencies as jest.Mock).mockResolvedValue([]); // No dependencies

    const [score, latency] = await calculateDependencyPinning('mockOwner', 'mockRepo');
    expect(score).toBe(1); // Expect 1.0 for zero dependencies as per requirements
    expect(latency).toBeGreaterThanOrEqual(0);
  });
});