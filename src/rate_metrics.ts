// rate_metrics.ts
import { getDependencies } from './dependency_parser';
import { getPullRequestCodeReview } from './pull_request_code_review';

export const calculateDependencyPinning = async (owner: string, repo: string): Promise<number> => {
  const dependencies = await getDependencies(owner, repo);
  
  // If no dependencies, return 1.0
  if (dependencies.length === 0) return 1.0;
  
  // Count pinned dependencies
  const pinnedCount = dependencies.filter(dep => {
    const version = dep.version.trim();
    return !version.includes('^') && 
           !version.includes('~') && 
           !version.includes('x') &&
           !version.includes('*');
  }).length;
  
  // Return the fraction of pinned dependencies
  return pinnedCount / dependencies.length;
};

export const calculateRateMetrics = async (owner: string, repo: string): Promise<{
  netScore: number;
  subScores: {
    dependencyPinning: number;
    pullRequestFraction: number;
  };
}> => {
  // Get both metrics concurrently
  const [dependencyPinning, pullRequestFraction] = await Promise.all([
    calculateDependencyPinning(owner, repo),
    getPullRequestCodeReview(owner, repo)
  ]);

  // Calculate net score (equal weights)
  const netScore = (dependencyPinning * 0.5) + (pullRequestFraction * 0.5);

  return {
    netScore,
    subScores: {
      dependencyPinning,
      pullRequestFraction
    }
  };
};