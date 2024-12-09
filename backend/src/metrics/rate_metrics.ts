import { getBusFactor } from './bus_factor';
import { getCorrectness } from './correctness';
import { calculateTotalTimeFromRepo } from './ramp_up_metric';
import { getResponsive } from './responsive_maintainer';
import { getLicense } from './license';
import { getPullRequestCodeReview } from './pull_request_code_review';
import { calculateDependencyPinning } from './dependency_pinning';
import { parseURL } from '../url_parse';

export const calculateRateMetrics = async (packageData: any) => {
  try {
    // Extract GitHub owner/repo from URL
    let owner = '';
    let repo = '';
    if (packageData.url) {
      [owner, repo] = await parseURL(packageData.url);
    }

    if (!owner || !repo) {
      throw new Error('Invalid repository URL');
    }

    const repoUrl = `https://github.com/${owner}/${repo}`;
    const start = Date.now();

    // Calculate all metrics in parallel
    const [
      busFactorResult,
      correctnessResult,
      rampUpResult,
      responsiveMaintainerResult,
      licenseResult,
      pullRequestResult,
      goodPinningPracticeResult
    ] = await Promise.all([
      getBusFactor(owner, repo),
      getCorrectness(owner, repo),
      calculateTotalTimeFromRepo(repoUrl),
      getResponsive(owner, repo),
      getLicense(owner, repo),
      getPullRequestCodeReview(owner, repo),
      calculateDependencyPinning(owner, repo)
    ]);

    // Extract metrics and handle failures
    const metrics = {
      BusFactor: Array.isArray(busFactorResult) ? busFactorResult[0] : busFactorResult,
      BusFactorLatency: Array.isArray(busFactorResult) ? busFactorResult[1] : 0,

      Correctness: Array.isArray(correctnessResult) ? correctnessResult[0] : correctnessResult,
      CorrectnessLatency: Array.isArray(correctnessResult) ? correctnessResult[1] : 0,

      RampUp: Array.isArray(rampUpResult) ? rampUpResult[0] : rampUpResult,
      RampUpLatency: Array.isArray(rampUpResult) ? rampUpResult[1] : 0,

      ResponsiveMaintainer: Array.isArray(responsiveMaintainerResult) ? responsiveMaintainerResult[0] : responsiveMaintainerResult,
      ResponsiveMaintainerLatency: Array.isArray(responsiveMaintainerResult) ? responsiveMaintainerResult[1] : 0,

      LicenseScore: Array.isArray(licenseResult) ? licenseResult[0] : licenseResult,
      LicenseScoreLatency: Array.isArray(licenseResult) ? licenseResult[1] : 0,

      PullRequest: Array.isArray(pullRequestResult) ? pullRequestResult[0] : pullRequestResult,
      PullRequestLatency: Array.isArray(pullRequestResult) ? pullRequestResult[1] : 0,

      GoodPinningPractice: goodPinningPracticeResult[0],
      GoodPinningPracticeLatency: goodPinningPracticeResult[1]
    };

    // Check if any metric failed
    if (Object.entries(metrics).some(([key, value]) => 
      !key.includes('Latency') && value === -1
    )) {
      return {
        RampUp: -1,
        Correctness: -1,
        BusFactor: -1,
        ResponsiveMaintainer: -1,
        LicenseScore: -1,
        GoodPinningPractice: -1,
        PullRequest: -1,
        NetScore: -1,
        RampUpLatency: metrics.RampUpLatency,
        CorrectnessLatency: metrics.CorrectnessLatency,
        BusFactorLatency: metrics.BusFactorLatency,
        ResponsiveMaintainerLatency: metrics.ResponsiveMaintainerLatency,
        LicenseScoreLatency: metrics.LicenseScoreLatency,
        GoodPinningPracticeLatency: metrics.GoodPinningPracticeLatency,
        PullRequestLatency: metrics.PullRequestLatency,
        NetScoreLatency: (Date.now() - start) / 1000
      };
    }

    // Calculate NetScore
    const weights = {
      RampUp: 0.2,
      Correctness: 0.2,
      BusFactor: 0.1,
      ResponsiveMaintainer: 0.2,
      LicenseScore: 0.1,
      GoodPinningPractice: 0.1,
      PullRequest: 0.1
    };

    const netScore = Object.entries(weights).reduce(
      (sum, [key, weight]) => sum + metrics[key as keyof typeof metrics] * weight,
      0
    );

    return {
      RampUp: metrics.RampUp,
      Correctness: metrics.Correctness,
      BusFactor: metrics.BusFactor,
      ResponsiveMaintainer: metrics.ResponsiveMaintainer,
      LicenseScore: metrics.LicenseScore,
      GoodPinningPractice: metrics.GoodPinningPractice,
      PullRequest: metrics.PullRequest,
      NetScore: netScore,
      RampUpLatency: metrics.RampUpLatency,
      CorrectnessLatency: metrics.CorrectnessLatency,
      BusFactorLatency: metrics.BusFactorLatency,
      ResponsiveMaintainerLatency: metrics.ResponsiveMaintainerLatency,
      LicenseScoreLatency: metrics.LicenseScoreLatency,
      GoodPinningPracticeLatency: metrics.GoodPinningPracticeLatency,
      PullRequestLatency: metrics.PullRequestLatency,
      NetScoreLatency: (Date.now() - start) / 1000
    };
  } catch (error) {
    // If any calculation fails, return -1 for all metrics
    return {
      RampUp: -1,
      Correctness: -1,
      BusFactor: -1,
      ResponsiveMaintainer: -1,
      LicenseScore: -1,
      GoodPinningPractice: -1,
      PullRequest: -1,
      NetScore: -1,
      RampUpLatency: -1,
      CorrectnessLatency: -1,
      BusFactorLatency: -1,
      ResponsiveMaintainerLatency: -1,
      LicenseScoreLatency: -1,
      GoodPinningPracticeLatency: -1,
      PullRequestLatency: -1,
      NetScoreLatency: -1
    };
  }
};