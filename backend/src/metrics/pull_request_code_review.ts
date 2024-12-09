import axios from 'axios';
import logger from '../logger';

// Function to get fraction of project code introduced via PRs that underwent code review
export async function getPullRequestCodeReview(owner: string, repo: string): Promise<number[]> {
    const start = Date.now();
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls?state=all`;
    logger.debug(`Fetching pull requests for ${owner}/${repo}`);

    try {
        const response = await axios.get(apiUrl);
        const pullRequests = response.data;

        // Consider only merged PRs, as only these have introduced code into the repository
        const mergedPullRequests = pullRequests.filter((pr: any) => pr.merged_at);

        const totalCodeChanges = mergedPullRequests.reduce(
            (acc: number, pr: any) => acc + (pr.changed_files || 0),
            0
        );

        // Calculate the portion of code from PRs that received review comments
        const reviewedCodeChanges = mergedPullRequests.reduce(
            (acc: number, pr: any) => acc + ((pr.review_comments && pr.review_comments > 0) ? pr.changed_files : 0),
            0
        );

        // If no code changes are introduced, avoid division by zero
        if (totalCodeChanges === 0) {
            return [0, (Date.now() - start) / 1000];
        }

        const fractionReviewed = reviewedCodeChanges / totalCodeChanges;
        logger.debug(`Reviewed Code Changes: ${reviewedCodeChanges}, Total Code Changes: ${totalCodeChanges}, Fraction Reviewed: ${fractionReviewed}`);

        return [fractionReviewed, (Date.now() - start) / 1000];
    } catch (error) {
        logger.error(`Error occurred while fetching pull requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return [0, (Date.now() - start) / 1000];  
    }
}
