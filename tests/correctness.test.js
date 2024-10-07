"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_request_1 = require("../src/graphql_request");
const correctness_1 = require("../src/correctness");
// 3 test cases
// Mocking dependencies
jest.mock('../src/graphql_request');
jest.mock('../src/logger');
describe('getCorrectness', () => {
    // Test case for successful correctness calculation
    it('should return a correctness score and elapsed time when issues are found', async () => {
        // Mocking the GraphQL response
        graphql_request_1.graphqlRequest.mockResolvedValue({
            data: {
                search: {
                    edges: [
                        { node: { state: 'CLOSED' } },
                        { node: { state: 'OPEN' } },
                        { node: { state: 'CLOSED' } }
                    ]
                }
            }
        });
        const owner = 'some-owner';
        const repoName = 'some-repo';
        // Call the function
        const result = await (0, correctness_1.getCorrectness)(owner, repoName);
        // Assert that the score is calculated correctly
        expect(result[0]).toBe(0.6666666666666666); // 2 CLOSED out of 3 total issues
        expect(result[1]).toBeGreaterThan(0); // Ensure elapsed time is positive
    });
    // Test case for when there are no issues
    it('should return a score of 0 and elapsed time when there are no issues', async () => {
        // Mocking the GraphQL response for no issues
        graphql_request_1.graphqlRequest.mockResolvedValue({
            data: {
                search: {
                    edges: []
                }
            }
        });
        const owner = 'some-owner';
        const repoName = 'some-repo';
        // Call the function
        const result = await (0, correctness_1.getCorrectness)(owner, repoName);
        // Assert that the score is 0
        expect(result[0]).toBe(0);
        expect(result[1]).toBeGreaterThan(0); // Ensure elapsed time is positive
    });
    // Test case for handling an API error
    it('should handle errors from the GraphQL API', async () => {
        // Mocking the GraphQL response to throw an error
        graphql_request_1.graphqlRequest.mockRejectedValue(new Error('API Error'));
        const owner = 'some-owner';
        const repoName = 'some-repo';
        // Expect the function to throw an error
        await expect((0, correctness_1.getCorrectness)(owner, repoName)).rejects.toThrow('API Error');
    });
});
//# sourceMappingURL=correctness.test.js.map