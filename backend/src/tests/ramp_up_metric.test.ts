import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { calculateTotalTimeFromRepo, deleteDirectoryRecursive, cloneGitHubRepo, calculateMetrics, calculateTimeToProgram, getJavaScriptFiles} from '../metrics/ramp_up_metric';

// 5 test cases

// Mocking the necessary modules
jest.mock('fs');
jest.mock('child_process');

describe('Ramp Up Metric', () => {
    const testDir = 'test_repo';
    const testUrl = 'https://github.com/some-user/some-repo.git';

    beforeEach(() => {
        // Clear mocks before each test
        jest.clearAllMocks();
    });

    // Test for cloning a GitHub repository
    it('should clone a GitHub repository', () => {
        // Mock execSync to simulate cloning
        (execSync as jest.Mock).mockImplementation(() => {});

        // Call the clone function
        cloneGitHubRepo(testUrl, testDir);

        // Assert that execSync was called with the correct command
        expect(execSync).toHaveBeenCalledWith(`git clone --quiet --depth 1 ${testUrl} ${testDir}`, { stdio: 'inherit' });
    });

    // Test for deleting a directory recursively
    it('should delete a directory recursively', () => {
        // Mock fs.existsSync and fs.readdirSync
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readdirSync as jest.Mock).mockReturnValue(['file1.js', 'file2.js']);

        // Mock fs.unlinkSync and fs.rmdirSync
        (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
        (fs.rmdirSync as jest.Mock).mockImplementation(() => {});

        // Call the delete function
        deleteDirectoryRecursive(testDir);

        // Assert that fs.unlinkSync and fs.rmdirSync were called
        expect(fs.unlinkSync).toHaveBeenCalledTimes(2); // For each file
        expect(fs.rmdirSync).toHaveBeenCalledWith(testDir);
    });

    // Test for calculating Halstead metrics from JavaScript content
    it('should calculate Halstead metrics from JavaScript content', () => {
        const jsContent = `
            function add(a, b) {
                return a + b;
            }
        `;

        // Call the metrics calculation
        const metrics = calculateMetrics(jsContent);

        // Assert the calculated metrics
        expect(metrics).toEqual({
            eta1: expect.any(Number), // Distinct operators
            eta2: expect.any(Number), // Distinct operands
            N1: expect.any(Number),    // Total operators
            N2: expect.any(Number)     // Total operands
        });
    });

    // Test for calculating time to program based on Halstead metrics
    it('should calculate time to program based on Halstead metrics', () => {
        const metrics = {
            eta1: 3,
            eta2: 2,
            N1: 5,
            N2: 3
        };

        // Calculate time
        const time = calculateTimeToProgram(metrics);

        // Assert the calculated time
        expect(time).toBeGreaterThan(0); // Ensure it's a positive time
    });

    it('should get all JavaScript files in a directory', () => {
        const testDir = 'test_repo'; // Your test directory
    
        // Mock the file system
        (fs.readdirSync as jest.Mock).mockImplementation((dir) => {
            if (dir === testDir) {
                return ['file1.js', 'file2.txt', 'folder']; // Simulate top-level directory contents
            } else if (dir === path.join(testDir, 'folder')) {
                return ['file2.txt']; // Simulate contents of 'folder'
            }
            return []; // Default case
        });
    
        (fs.statSync as jest.Mock).mockImplementation((filePath) => {
            // Handle the top-level files
            if (filePath === path.join(testDir, 'file1.js')) {
                return { isDirectory: () => false }; // Simulate a JS file
            }
            if (filePath === path.join(testDir, 'file2.txt')) {
                return { isDirectory: () => false }; // Simulate a non-JS file
            }
            if (filePath === path.join(testDir, 'folder')) {
                return { isDirectory: () => true }; // Simulate a folder
            }
            // If you want to ignore JS files in the nested folder:
            if (filePath === path.join(testDir, 'folder', 'file1.js')) {
                return { isDirectory: () => false }; // Simulate a JS file in the folder
            }
            if (filePath === path.join(testDir, 'folder', 'file2.txt')) {
                return { isDirectory: () => false }; // Simulate a non-JS file in the folder
            }
    
            // If the filePath doesn't match any known paths, throw an error
            throw new Error(`Unexpected filePath: ${filePath}`);
        });
    
        // Call the function
        const files = getJavaScriptFiles(testDir);
    
        // Assert that only JavaScript files are returned
        expect(files).toEqual([path.join(testDir, 'file1.js')]); // Expect only the top-level JS file
    });

    // Test for calculating total time from a GitHub repository
    it('should calculate total time from a GitHub repository', () => {
        // Mocking the necessary functions
        (execSync as jest.Mock).mockImplementation(() => {});
        (fs.readFileSync as jest.Mock).mockReturnValue(`
            function add(a, b) {
                return a + b;
            }
        `);

        // Mock getJavaScriptFiles to return a specific file
        (fs.readdirSync as jest.Mock).mockReturnValue(['file1.js']);
        (fs.statSync as jest.Mock).mockImplementation((filePath) => {
            return { isDirectory: () => false };
        });

        // Call the main function
        const result = calculateTotalTimeFromRepo(testUrl);

        // Assert the result is valid
        const [score, latency] = result; // Destructure the array result

        // Assert that the score is less than 1 (assuming time_max is set to 100)
        expect(score).toBeLessThan(1);

        // Assert that the latency is greater than 0 (ensure the calculation took time)
        expect(latency).toBeGreaterThan(0);
    });

    // Test for handling errors during repository cloning
    it('should handle errors during repository cloning', () => {
        // Mock execSync to throw an error
        (execSync as jest.Mock).mockImplementation(() => {
            throw new Error('Clone failed');
        });


        const [result,] = calculateTotalTimeFromRepo(testUrl);
        expect(result).toBe(0); // Indicating failure

    });
});