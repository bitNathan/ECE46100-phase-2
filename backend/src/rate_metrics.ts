// rate_metrics.ts
import { getDependencies } from './dependency_parser';
import { getPullRequestCodeReview } from './pull_request_code_review';

const isMajorMinorPinned = (version: string): boolean => {
    // Remove any leading special characters (^, ~, v)
    const cleanVersion = version.replace(/^[^0-9]*/, '');
    
    // Match versions like "2.3" or "2.3.4" but not "2.3.x" or "~2.3.4"
    const majorMinorRegex = /^\d+\.\d+(\.\d+)?$/;
    
    return majorMinorRegex.test(cleanVersion) && 
           !version.includes('^') && 
           !version.includes('~') && 
           !version.endsWith('x') && 
           !version.endsWith('*');
};
  

export const calculateDependencyPinning = async (owner: string, repo: string): Promise<number> => {
    const dependencies = await getDependencies(owner, repo);
    
    // If no dependencies, return 1.0
    if (dependencies.length === 0) return 1.0;
    
    // Count dependencies pinned to major+minor version
    const pinnedDependencies = dependencies.filter(dep => isMajorMinorPinned(dep.version));
    console.log('Pinned Dependencies:', pinnedDependencies); // Debug log
    
    // Calculate and return fraction of pinned dependencies
    return pinnedDependencies.length / dependencies.length;
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