import { getBusFactor } from '../metrics/bus_factor';
import { getCorrectness } from '../metrics/correctness';
import { calculateTotalTimeFromRepo } from '../metrics/ramp_up_metric';
import { getResponsive } from '../metrics/responsive_maintainer';
import { getLicense } from '../metrics/license';
import { getPullRequestCodeReview } from '../metrics/pull_request_code_review';
import { calculateDependencyPinning } from '../metrics/dependency_pinning';

// Placeholder ratePackage function: TODO IMPLEMENT
// ****Checking quality is only done on public ingest. ACME employees are trusted to upload code directly.
export const ratePackage = async (owner: string, repo: string): Promise<number[]> => {

  const start = Date.now();
  const repoUrl = `https://github.com/${owner}/${repo}`;

  try {
    const [
      [busFactorResult, busFactorLatency],
      [correctnessResult, correctnessLatency],
      [rampUpResult, rampUpLatency],
      [responsiveMaintainerResult, responsiveMaintainerLatency],
      [licenseResult, licenseLatency],
      [pullRequestResult, pullRequestLatency],
      [goodPinningPractice, goodPinningPracticeLatency]
    ] = await Promise.all([
      getBusFactor(owner, repo),
      getCorrectness(owner, repo),
      calculateTotalTimeFromRepo(repoUrl),
      getResponsive(owner, repo),
      getLicense(owner, repo),
      getPullRequestCodeReview(owner, repo),
      calculateDependencyPinning(owner, repo)
    ]);

    return [busFactorResult, correctnessResult, rampUpResult, responsiveMaintainerResult, licenseResult, pullRequestResult, goodPinningPractice];
  } catch (error) {
    console.error('Error calculating package rate:', error);
    return [-1, -1, -1, -1, -1, -1, -1];
  }
};