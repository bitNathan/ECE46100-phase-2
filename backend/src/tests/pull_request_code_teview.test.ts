import axios from 'axios';
import { getPullRequestCodeReview } from '../pull_request_code_review';
import logger from '../logger';

// Mocking the axios library
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Pull Request Code Review Metric', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    it('should return correct fraction of reviewed code changes', async () => {
        // Mock the GitHub API response for pull requests
        const mockedResponse = {
            data: [
                { changed_files: 10, review_comments: 5 },
                { changed_files: 20, review_comments: 0 },
                { changed_files: 15, review_comments: 3 }
            ]
        };
        mockedAxios.get.mockResolvedValue(mockedResponse);

        const fractionReviewed = await getPullRequestCodeReview('mockOwner', 'mockRepo');

        // Check if the result is correct
        expect(fractionReviewed).toBeCloseTo(0.5556, 4);  // (5 + 3) / (10 + 20 + 15) = 0.5
    });

    it('should return 0 when no pull requests are found', async () => {
        // Mock the GitHub API response to return an empty list of pull requests
        mockedAxios.get.mockResolvedValue({ data: [] });

        const fractionReviewed = await getPullRequestCodeReview('mockOwner', 'mockRepo');

        // Check if the result is correct
        expect(fractionReviewed).toBe(0);  // No changes, so fraction is 0
    });

    it('should return 0 if the API call fails', async () => {
        // Mock the GitHub API response to throw an error
        mockedAxios.get.mockRejectedValue(new Error('API request failed'));

        const fractionReviewed = await getPullRequestCodeReview('mockOwner', 'mockRepo');

        // Check if the result is correct
        expect(fractionReviewed).toBe(0);  // API call failed
    });
});
