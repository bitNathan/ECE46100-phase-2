import { calculateDependencyPinning } from '../metrics/rate_metrics'; // Adjust this path if needed
import { getDependencies } from '../dependency_parser';

jest.mock('../dependency_parser'); // Mocking the entire module

describe('Dependency Pinning Metric', () => {
    it('should return the correct fraction of pinned dependencies', async () => {
        (getDependencies as jest.Mock).mockResolvedValue([
            { name: 'dep1', version: '2.3.4' }, // Pinned
            { name: 'dep2', version: '2.4.x' }, // Not pinned
            { name: 'dep3', version: '3.0.0' }, // Pinned
        ]);

        const result = await calculateDependencyPinning('mockOwner', 'mockRepo');

        expect(result).toBeCloseTo(0.67, 2); // Two pinned out of three dependencies
    });

    it('should return 0 when no dependencies are pinned', async () => {
        (getDependencies as jest.Mock).mockResolvedValue([
            { name: 'dep1', version: '2.x' }, // Not pinned
            { name: 'dep2', version: '3.x' }, // Not pinned
        ]);

        const result = await calculateDependencyPinning('mockOwner', 'mockRepo');

        expect(result).toBe(0); // No pinned dependencies
    });

    it('should return 1 when there are no dependencies', async () => {
        (getDependencies as jest.Mock).mockResolvedValue([]); // No dependencies
    
        const result = await calculateDependencyPinning('mockOwner', 'mockRepo');
    
        expect(result).toBe(1); // Expect 1.0 for zero dependencies as per requirements
    });
    
});