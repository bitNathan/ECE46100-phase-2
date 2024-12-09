import axios from 'axios';

interface PackageRating {
    BusFactor: number;
    Correctness: number;
    RampUp: number;
    ResponsiveMaintainer: number;
    LicenseScore: number;
    GoodPinningPractice: number;
    PullRequest: number;
    NetScore: number;
    // Latency metrics
    BusFactorLatency: number;
    CorrectnessLatency: number;
    RampUpLatency: number;
    ResponsiveMaintainerLatency: number;
    LicenseScoreLatency: number;
    GoodPinningPracticeLatency: number;
    PullRequestLatency: number;
    NetScoreLatency: number;
}

interface PackageData {
    URL?: string;
    Content?: string;
    JSProgram?: string;
    Name?: string;
}

interface PackageMetadata {
    Name: string;
    Version: string;
    ID: string;
}

interface Package {
    metadata: PackageMetadata;
    data: PackageData;
}

export class PackageIngestionService {
    private readonly METRIC_THRESHOLD = 0.5;
    private readonly apiBaseUrl: string;
    private readonly authToken: string;

    constructor(apiBaseUrl: string, authToken: string) {
        this.apiBaseUrl = apiBaseUrl;
        this.authToken = authToken;
    }

    async ingestPackage(packageData: PackageData): Promise<boolean> {
        try {
            // Step 1: Calculate and verify metrics
            const metrics = await this.getRatingMetrics(packageData);
            if (!this.validateMetrics(metrics)) {
                console.log('Package failed metrics validation');
                return false;
            }

            // Step 2: Upload package
            const uploadResult = await this.uploadPackage(packageData);
            return uploadResult;

        } catch (error) {
            console.error('Package ingestion failed:', error);
            return false;
        }
    }

    private async getRatingMetrics(packageData: PackageData): Promise<PackageRating> {
        // First create a temporary package to rate
        const tempPackage = await this.createTemporaryPackage(packageData);
        
        if (!tempPackage) {
            throw new Error('Failed to create temporary package for rating');
        }

        const response = await axios.get(
            `${this.apiBaseUrl}/package/${tempPackage.metadata.ID}/rate`,
            {
                headers: {
                    'X-Authorization': this.authToken,
                }
            }
        );

        return response.data;
    }

    private validateMetrics(metrics: PackageRating): boolean {
        const requiredMetrics = {
            BusFactor: metrics.BusFactor,
            Correctness: metrics.Correctness,
            RampUp: metrics.RampUp,
            ResponsiveMaintainer: metrics.ResponsiveMaintainer,
            LicenseScore: metrics.LicenseScore,
            GoodPinningPractice: metrics.GoodPinningPractice,
            PullRequest: metrics.PullRequest,
            NetScore: metrics.NetScore
        };

        // Verify all required metrics exist and are valid
        for (const [metric, value] of Object.entries(requiredMetrics)) {
            if (value === undefined || value === -1) {
                console.log(`Missing or invalid metric: ${metric}`);
                return false;
            }
        }

        // Verify all non-latency metrics meet threshold
        return Object.values(requiredMetrics).every(value => value >= this.METRIC_THRESHOLD);
    }

    private async createTemporaryPackage(packageData: PackageData): Promise<Package | null> {
        try {
            const response = await axios.post(
                `${this.apiBaseUrl}/package`,
                packageData,
                {
                    headers: {
                        'X-Authorization': this.authToken,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Failed to create temporary package:', error);
            return null;
        }
    }

    private async uploadPackage(packageData: PackageData): Promise<boolean> {
        try {
            const response = await axios.post(
                `${this.apiBaseUrl}/package`,
                packageData,
                {
                    headers: {
                        'X-Authorization': this.authToken,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.status === 201;
        } catch (error) {
            console.error('Package upload failed:', error);
            return false;
        }
    }
}

export async function ingestNewPackage(
    packageUrl: string,
    apiBaseUrl: string,
    authToken: string
): Promise<boolean> {
    const ingestionService = new PackageIngestionService(apiBaseUrl, authToken);
    
    const packageData: PackageData = {
        URL: packageUrl
    };

    return await ingestionService.ingestPackage(packageData);
}