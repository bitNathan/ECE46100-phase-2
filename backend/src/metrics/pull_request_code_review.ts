//pull_request_code_review.ts
import axios from 'axios';
import logger from '../logger';

// Function to get pull request data
export async function getPullRequestCodeReview(owner: string, repo: string): Promise<number[]> {
    const start = Date.now();
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls?state=all`;
    logger.debug(`Fetching pull requests for ${owner}/${repo}`);

    try {
        const response = await axios.get(apiUrl);
        const pullRequests = response.data;

        const totalCodeChanges = pullRequests.reduce(
            (acc: number, pr: any) => acc + (pr.changed_files || 0),
            0
        );

        const reviewedCodeChanges = pullRequests.reduce(
            (acc: number, pr: any) => acc + ((pr.review_comments && pr.review_comments > 0) ? pr.changed_files : 0),
            0
        );

        if (totalCodeChanges === 0) {
            return [0, (Date.now() - start) / 1000];  // Avoid division by zero if no changes at all
        }

        // Return the fraction of reviewed changes
        const fractionReviewed = reviewedCodeChanges / totalCodeChanges;
        logger.debug(`Reviewed Code Changes: ${reviewedCodeChanges}, Total Code Changes: ${totalCodeChanges}`);
        return [fractionReviewed, (Date.now() - start) / 1000];

    } catch (error) {
        logger.error(`Error occurred while fetching pull requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return [0, (Date.now() - start) / 1000];  // Default value in case of error
    }
}
