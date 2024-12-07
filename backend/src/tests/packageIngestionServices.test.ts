import { PackageIngestionService } from '../routes/packageIngestionServices';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('PackageIngestionService', () => {
    let packageIngestionService: PackageIngestionService;
    let mockAxios: MockAdapter;
    const apiBaseUrl = 'http://test-api.com';
    const authToken = 'test-token';

    beforeEach(() => {
        mockAxios = new MockAdapter(axios);
        packageIngestionService = new PackageIngestionService(apiBaseUrl, authToken);
    });

    afterEach(() => {
        mockAxios.restore();
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
            mockAxios.onPost(`${apiBaseUrl}/package`).replyOnce(201, testPackage);
            
            // Mock metrics retrieval
            mockAxios.onGet(`${apiBaseUrl}/package/test-id/rate`)
                .replyOnce(200, validMetrics);
            
            // Mock final package upload
            mockAxios.onPost(`${apiBaseUrl}/package`).replyOnce(201, testPackage);

            const result = await packageIngestionService.ingestPackage({
                URL: 'https://github.com/test/repo'
            });

            expect(result).toBe(true);
        });

        it('should reject package with invalid metrics', async () => {
            // Mock temporary package creation
            mockAxios.onPost(`${apiBaseUrl}/package`).replyOnce(201, testPackage);
            
            // Mock metrics retrieval with invalid metrics
            mockAxios.onGet(`${apiBaseUrl}/package/test-id/rate`)
                .replyOnce(200, invalidMetrics);

            const result = await packageIngestionService.ingestPackage({
                URL: 'https://github.com/test/repo'
            });

            expect(result).toBe(false);
        });

        it('should handle API errors gracefully', async () => {
            // Mock API error
            mockAxios.onPost(`${apiBaseUrl}/package`).networkError();

            const result = await packageIngestionService.ingestPackage({
                URL: 'https://github.com/test/repo'
            });

            expect(result).toBe(false);
        });

        it('should handle missing metrics', async () => {
            // Mock temporary package creation
            mockAxios.onPost(`${apiBaseUrl}/package`).replyOnce(201, testPackage);
            
            // Mock metrics retrieval with missing metric
            mockAxios.onGet(`${apiBaseUrl}/package/test-id/rate`)
                .replyOnce(200, {
                    ...validMetrics,
                    BusFactor: undefined
                });

            const result = await packageIngestionService.ingestPackage({
                URL: 'https://github.com/test/repo'
            });

            expect(result).toBe(false);
        });

        it('should handle invalid metric values (-1)', async () => {
            // Mock temporary package creation
            mockAxios.onPost(`${apiBaseUrl}/package`).replyOnce(201, testPackage);
            
            // Mock metrics retrieval with invalid metric value
            mockAxios.onGet(`${apiBaseUrl}/package/test-id/rate`)
                .replyOnce(200, {
                    ...validMetrics,
                    BusFactor: -1
                });

            const result = await packageIngestionService.ingestPackage({
                URL: 'https://github.com/test/repo'
            });

            expect(result).toBe(false);
        });
    });
});