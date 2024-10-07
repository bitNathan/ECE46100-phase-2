"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_request_1 = require("../src/graphql_request");
const logger_1 = __importDefault(require("../src/logger"));
const responsive_maintainer_1 = require("../src/responsive_maintainer");
// 5 test cases
// Mock the necessary modules
jest.mock('../src/graphql_request');
jest.mock('../src/logger');
describe('Responsive Maintainer Metric', () => {
    const owner = 'some-user';
    const repoName = 'some-repo';
    beforeEach(() => {
        // Clear mocks before each test
        jest.clearAllMocks();
    });
    // Test for successful calculation of the responsive metric
    it('should calculate the responsive metric successfully', async () => {
        // Mock GraphQL response with commit data and issues/PRs
        graphql_request_1.graphqlRequest.mockResolvedValue({
            data: {
                repository: {
                    defaultBranchRef: {
                        target: {
                            history: {
                                edges: [
                                    { node: { committedDate: '2023-01-01T00:00:00Z' } },
                                    { node: { committedDate: '2023-01-02T00:00:00Z' } },
                                    { node: { committedDate: '2023-01-03T00:00:00Z' } },
                                ],
                            },
                        },
                    },
                    issues: {
                        totalCount: 3,
                    },
                    pullRequests: {
                        totalCount: 2,
                    },
                },
            },
        });
        // Call the function
        const result = await (0, responsive_maintainer_1.getResponsive)(owner, repoName);
        // Assert the expected result
        expect(result).toEqual(expect.arrayContaining([expect.any(Number), expect.any(Number)]));
    });
    // Test for insufficient data (not enough commits)
    it('should return [0, 0] if there are not enough commits', async () => {
        // Mock GraphQL response with insufficient commit data
        graphql_request_1.graphqlRequest.mockResolvedValue({
            data: {
                repository: {
                    defaultBranchRef: {
                        target: {
                            history: {
                                edges: [{ node: { committedDate: '2023-01-01T00:00:00Z' } }],
                            },
                        },
                    },
                    issues: {
                        totalCount: 1,
                    },
                    pullRequests: {
                        totalCount: 0,
                    },
                },
            },
        });
        // Call the function
        const result = await (0, responsive_maintainer_1.getResponsive)(owner, repoName);
        // Assert that the result is [0, 0]
        expect(result).toEqual([0, 0]);
    });
    // Test for cases with no issues or PRs
    it('should return [0, 0] if there are no issues or PRs', async () => {
        // Mock GraphQL response with commits but no issues/PRs
        graphql_request_1.graphqlRequest.mockResolvedValue({
            data: {
                repository: {
                    defaultBranchRef: {
                        target: {
                            history: {
                                edges: [
                                    { node: { committedDate: '2023-01-01T00:00:00Z' } },
                                    { node: { committedDate: '2023-01-02T00:00:00Z' } },
                                ],
                            },
                        },
                    },
                    issues: {
                        totalCount: 0,
                    },
                    pullRequests: {
                        totalCount: 0,
                    },
                },
            },
        });
        // Call the function
        const result = await (0, responsive_maintainer_1.getResponsive)(owner, repoName);
        // Assert that the result is [0, 0]
        expect(result).toEqual([0, 0]);
    });
    // Test for average time between commits exceeding upper limit
    it('should return [0, 0] if average time between commits is greater than 100 hours', async () => {
        // Mock GraphQL response with sufficient commit data and issues/PRs
        graphql_request_1.graphqlRequest.mockResolvedValue({
            data: {
                repository: {
                    defaultBranchRef: {
                        target: {
                            history: {
                                edges: [
                                    { node: { committedDate: '2023-01-01T00:00:00Z' } },
                                    { node: { committedDate: '2023-12-31T00:00:00Z' } }, // 364 days apart
                                ],
                            },
                        },
                    },
                    issues: {
                        totalCount: 1,
                    },
                    pullRequests: {
                        totalCount: 1,
                    },
                },
            },
        });
        // Call the function
        const result = await (0, responsive_maintainer_1.getResponsive)(owner, repoName);
        // Assert that the result is [0, 0]
        expect(result).toEqual([0, 0]);
    });
    // Test for logging the result of the calculation
    it('should log the average time between commits', async () => {
        // Mock GraphQL response
        graphql_request_1.graphqlRequest.mockResolvedValue({
            data: {
                repository: {
                    defaultBranchRef: {
                        target: {
                            history: {
                                edges: [
                                    { node: { committedDate: '2023-01-01T00:00:00Z' } },
                                    { node: { committedDate: '2023-01-02T00:00:00Z' } },
                                ],
                            },
                        },
                    },
                    issues: {
                        totalCount: 1,
                    },
                    pullRequests: {
                        totalCount: 1,
                    },
                },
            },
        });
        // Call the function
        await (0, responsive_maintainer_1.getResponsive)(owner, repoName);
        // Assert that the infoDebug method was called
        expect(logger_1.default.infoDebug).toHaveBeenCalled();
    });
});
//# sourceMappingURL=responsive_maintainer.test.js.map