import * as fs from 'fs';
import * as readline from 'readline';
import axios from 'axios';
import logger from './logger';
import { parseURL } from './url_parse';
import { getBusFactor } from './metrics/bus_factor';
import { getCorrectness } from './metrics/correctness';
import { calculateTotalTimeFromRepo } from './metrics/ramp_up_metric';
import { getResponsive } from './metrics/responsive_maintainer';
import { getLicense } from './metrics/license';
import { getPullRequestCodeReview } from './metrics/pull_request_code_review';
import { calculateRateMetrics } from './metrics/rate_metrics';
import { getPinnedDependencies } from './metrics/pinned_dependencies';

interface AnalysisResult {
    URL: string;
    NetScore: number;
    NetScore_Latency: number;
    RampUp: number;
    RampUp_Latency: number;
    Correctness: number;
    Correctness_Latency: number;
    BusFactor: number;
    BusFactor_Latency: number;
    ResponsiveMaintainer: number;
    ResponsiveMaintainer_Latency: number;
    License: number;
    License_Latency: number;
    PullRequestCodeReview: number;
    PullRequestCodeReview_Latency: number;
    PinnedDependencies: number;
    PinnedDependencies_Latency: number;
}

class RepositoryAnalyzer {
    private static calculateNetScore(metrics: Partial<AnalysisResult>): number {
    const {
        BusFactor = 0,  // Default to 0 if undefined
        Correctness = 0,
        RampUp = 0,
        ResponsiveMaintainer = 0,
        License = 0, 
        PullRequestCodeReview = 0,
        PinnedDependencies = 0
    } = metrics;

    // Compute weighted average
    const weightedScore = (
        (0.2 * BusFactor) +
        (0.2 * Correctness) +
        (0.15 * RampUp) +
        (0.15 * ResponsiveMaintainer) +
        (0.15 * PullRequestCodeReview) +
        (0.15 * PinnedDependencies)
    );

    // Multiply by license to apply the licensing factor
    return weightedScore * License;
}

    static async analyzeRepository(repoUrl: string): Promise<AnalysisResult> {
        const start = Date.now();
        logger.info(`Starting analysis of repository: ${repoUrl}`);

        const [owner, repo] = await parseURL(repoUrl);
        if (!owner || !repo) {
            throw new Error("Invalid URL or unsupported repository format.");
        }

        const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
        logger.debug(`Fetching repository data from GitHub for ${owner}/${repo}`);

        const [repoData, contributorsData, issuesData, commitsData] = await Promise.all([
            axios.get(apiUrl),
            axios.get(`${apiUrl}/contributors`),
            axios.get(`${apiUrl}/issues`),
            axios.get(`${apiUrl}/commits`)
        ]);

        const metricPromises = [
            getBusFactor(owner, repo),
            getCorrectness(owner, repo),
            calculateTotalTimeFromRepo(`https://github.com/${owner}/${repo}`),
            getResponsive(owner, repo),
            getLicense(owner, repo),
            getPullRequestCodeReview(owner, repo),
            getPinnedDependencies(owner, repo)
        ];

        const metricResults = await Promise.all(metricPromises);

        const busFactor = Array.isArray(metricResults[0]) ? metricResults[0][0] : metricResults[0];
        const busFactorLatency = Array.isArray(metricResults[0]) ? metricResults[0][1] : 0;
        
        const correctness = Array.isArray(metricResults[1]) ? metricResults[1][0] : metricResults[1];
        const correctnessLatency = Array.isArray(metricResults[1]) ? metricResults[1][1] : 0;

        const rampUp = Array.isArray(metricResults[2]) ? metricResults[2][0] : metricResults[2];
        const rampUpLatency = Array.isArray(metricResults[2]) ? metricResults[2][1] : 0;

        const responsiveMaintainer = Array.isArray(metricResults[3]) ? metricResults[3][0] : metricResults[3];
        const responsiveMaintainerLatency = Array.isArray(metricResults[3]) ? metricResults[3][1] : 0;

        const license = Array.isArray(metricResults[4]) ? metricResults[4][0] : metricResults[4];
        const licenseLatency = Array.isArray(metricResults[4]) ? metricResults[4][1] : 0;

        const pullRequestCodeReview = Array.isArray(metricResults[5]) ? metricResults[5][0] : metricResults[5];
        const pullRequestCodeReviewLatency = Array.isArray(metricResults[5]) ? metricResults[5][1] : 0;

        const pinnedDependencies = Array.isArray(metricResults[6]) ? metricResults[6][0] : metricResults[6];
        const pinnedDependenciesLatency = Array.isArray(metricResults[6]) ? metricResults[6][1] : 0;

        const result: AnalysisResult = {
            URL: repoUrl,
            NetScore: 0,
            NetScore_Latency: 0,
            RampUp: Number(rampUp.toFixed(2)),
            RampUp_Latency: Number(rampUpLatency.toFixed(3)),
            Correctness: Number(correctness.toFixed(2)),
            Correctness_Latency: Number(correctnessLatency.toFixed(3)),
            BusFactor: Number(busFactor.toFixed(2)),
            BusFactor_Latency: Number(busFactorLatency.toFixed(3)),
            ResponsiveMaintainer: Number(responsiveMaintainer.toFixed(2)),
            ResponsiveMaintainer_Latency: Number(responsiveMaintainerLatency.toFixed(3)),
            License: Number(license.toFixed(2)),
            License_Latency: Number(licenseLatency.toFixed(3)),
            PullRequestCodeReview: Number(pullRequestCodeReview.toFixed(2)),
            PullRequestCodeReview_Latency: Number(pullRequestCodeReviewLatency.toFixed(3)),
            PinnedDependencies: Number(pinnedDependencies.toFixed(2)),
            PinnedDependencies_Latency: Number(pinnedDependenciesLatency.toFixed(3))
        };

        result.NetScore = Number(this.calculateNetScore(result).toFixed(2));
        result.NetScore_Latency = Number(((Date.now() - start) / 1000).toFixed(3));

        logger.info(`Analysis completed for repository: ${repoUrl}`);
        return result;
    }

    static async processUrlFile(filePath: string): Promise<void> {
        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            const url = line.trim();
            if (url) {
                try {
                    const result = await this.analyzeRepository(url);
                    console.log(JSON.stringify(result).replace(/,/g, ', '));
                } catch (error) {
                    if (error instanceof Error) {
                        logger.info(`Failed to analyze repository: ${url}. Error: ${error.message}`);
                    } else {
                        logger.info(`Failed to analyze repository: ${url}. An unknown error occurred.`);
                    }
                }
            }
        }

        rl.close();
    }
}

class CLI {
    static async run(args: string[]): Promise<number> {
        if (args.length === 0) {
            logger.info("Please provide a file path containing repository URLs.");
            logger.info("Example: ./cli analyze <file-path>");
            return 1;
        }

        const [command, filePath] = args;
        if (command === 'analyze' && filePath) {
            return this.analyzeFromFile(filePath);
        }

        logger.info("Invalid command or missing file path. Use './cli analyze <file-path>'.");
        return 1;
    }

    private static async analyzeFromFile(filePath: string): Promise<number> {
        try {
            await RepositoryAnalyzer.processUrlFile(filePath);
            return 0;
        } catch (error) {
            if (error instanceof Error) {
                logger.info(`Failed to process file: ${filePath}. Error: ${error.message}`);
            } else {
                logger.info(`Failed to process file: ${filePath}. An unknown error occurred.`);
            }
            return 1;
        }
    }
}

async function main() {
    try {
        const exitCode = await CLI.run(process.argv.slice(2));
        process.exit(exitCode);
    } catch (error) {
        console.error('Unhandled error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export { RepositoryAnalyzer, CLI };