import axios from 'axios';
import logger from '../logger';

// Function to get pull request data
export async function getPullRequestCodeReview(owner: string, repo: string): Promise<number> {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls?state=all`;
    logger.debug(`Fetching pull requests for ${owner}/${repo}`);

    try {
        const response = await axios.get(apiUrl);
        const pullRequests = response.data;

        // Assuming the response includes a 'review_comments' property for each PR
        const totalCodeChanges = pullRequests.reduce((acc: number, pr: any) => {
            return acc + (pr.changed_files || 0);
        }, 0);

        const reviewedCodeChanges = pullRequests.reduce((acc: number, pr: any) => {
            // Count changes only for PRs that have review comments
            return acc + (pr.review_comments ? pr.changed_files : 0);
        }, 0);

        if (totalCodeChanges === 0) return 0;  // Avoid division by zero

        // Return the fraction of reviewed changes
        const fractionReviewed = reviewedCodeChanges / totalCodeChanges;
        logger.debug(`Reviewed Code Changes: ${reviewedCodeChanges}, Total Code Changes: ${totalCodeChanges}`);
        return fractionReviewed;
    } catch (error) {
        logger.error(`Error occurred while fetching pull requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return 0;  // Default value in case of error
    }
}
