import { PackageIngestionService } from '../routes/packageIngestionServices';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PackageIngestionService', () => {
    let packageIngestionService: PackageIngestionService;
    const apiBaseUrl = 'http://test-api.com';
    const authToken = 'test-token';

    beforeEach(() => {
        packageIngestionService = new PackageIngestionService(apiBaseUrl, authToken);
        jest.clearAllMocks();
    });

    describe('ingestPackage', () => {
        const validMetrics = {
            BusFactor: 0.8,
            Correctness: 0.9,
            RampUp: 0.7,
            ResponsiveMaintainer: 0.85,
            LicenseScore: 1.0,
            GoodPinningPractice: 0.95,
            PullRequest: 0.75,
            NetScore: 0.85,
            BusFactorLatency: 0.1,
            CorrectnessLatency: 0.1,
            RampUpLatency: 0.1,
            ResponsiveMaintainerLatency: 0.1,
            LicenseScoreLatency: 0.1,
            GoodPinningPracticeLatency: 0.1,
            PullRequestLatency: 0.1,
            NetScoreLatency: 0.1
        };

        const invalidMetrics = {
            ...validMetrics,
            BusFactor: 0.3, // Below threshold
            Correctness: 0.4 // Below threshold
        };

        const testPackage = {
            metadata: {
                Name: 'test-package',
                Version: '1.0.0',
                ID: 'test-id'
            },
            data: {
                URL: 'https://github.com/test/repo'
            }
        };

        it('should successfully ingest a package with valid metrics', async () => {
            // Mock temporary package creation
            mockedAxios.post.mockResolvedValueOnce({ data: testPackage, status: 201 });
            
            // Mock metrics retrieval
            mockedAxios.get.mockResolvedValueOnce({ data: validMetrics, status: 200 });
            
            // Mock final package upload
            mockedAxios.post.mockResolvedValueOnce({ data: testPackage, status: 201 });

            const result = await packageIngestionService.ingestPackage({
                URL: 'https://github.com/test/repo'
            });

            expect(result).toBe(true);
            expect(mockedAxios.post).toHaveBeenCalledTimes(2);
            expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        });

        it('should reject package with invalid metrics', async () => {
            // Mock temporary package creation
            mockedAxios.post.mockResolvedValueOnce({ data: testPackage, status: 201 });
            
            // Mock metrics retrieval with invalid metrics
            mockedAxios.get.mockResolvedValueOnce({ data: invalidMetrics, status: 200 });

            const result = await packageIngestionService.ingestPackage({
                URL: 'https://github.com/test/repo'
            });

            expect(result).toBe(false);
            expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        });

        it('should handle API errors gracefully', async () => {
            // Mock API error
            mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

            const result = await packageIngestionService.ingestPackage({
                URL: 'https://github.com/test/repo'
            });

            expect(result).toBe(false);
            expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        });

        it('should handle missing metrics', async () => {
            // Mock temporary package creation
            mockedAxios.post.mockResolvedValueOnce({ data: testPackage, status: 201 });
            
            // Mock metrics retrieval with missing metric
            mockedAxios.get.mockResolvedValueOnce({ 
                data: {
                    ...validMetrics,
                    BusFactor: undefined
                }, 
                status: 200 
            });

            const result = await packageIngestionService.ingestPackage({
                URL: 'https://github.com/test/repo'
            });

            expect(result).toBe(false);
            expect(mockedAxios.post).toHaveBeenCalledTimes(1);
            expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        });

        it('should handle invalid metric values (-1)', async () => {
            // Mock temporary package creation
            mockedAxios.post.mockResolvedValueOnce({ data: testPackage, status: 201 });
            
            // Mock metrics retrieval with invalid metric value
            mockedAxios.get.mockResolvedValueOnce({ 
                data: {
                    ...validMetrics,
                    BusFactor: -1
                }, 
                status: 200 
            });

            const result = await packageIngestionService.ingestPackage({
                URL: 'https://github.com/test/repo'
            });

            expect(result).toBe(false);
            expect(mockedAxios.post).toHaveBeenCalledTimes(1);
            expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        });
    });
});