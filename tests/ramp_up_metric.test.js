"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const ramp_up_metric_1 = require("../src/ramp_up_metric");
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
        child_process_1.execSync.mockImplementation(() => { });
        // Call the clone function
        (0, ramp_up_metric_1.cloneGitHubRepo)(testUrl, testDir);
        // Assert that execSync was called with the correct command
        expect(child_process_1.execSync).toHaveBeenCalledWith(`git clone --depth 1 ${testUrl} ${testDir}`, { stdio: 'inherit' });
    });
    // Test for deleting a directory recursively
    it('should delete a directory recursively', () => {
        // Mock fs.existsSync and fs.readdirSync
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue(['file1.js', 'file2.js']);
        // Mock fs.unlinkSync and fs.rmdirSync
        fs.unlinkSync.mockImplementation(() => { });
        fs.rmdirSync.mockImplementation(() => { });
        // Call the delete function
        (0, ramp_up_metric_1.deleteDirectoryRecursive)(testDir);
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
        const metrics = (0, ramp_up_metric_1.calculateMetrics)(jsContent);
        // Assert the calculated metrics
        expect(metrics).toEqual({
            eta1: expect.any(Number), // Distinct operators
            eta2: expect.any(Number), // Distinct operands
            N1: expect.any(Number), // Total operators
            N2: expect.any(Number) // Total operands
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
        const time = (0, ramp_up_metric_1.calculateTimeToProgram)(metrics);
        // Assert the calculated time
        expect(time).toBeGreaterThan(0); // Ensure it's a positive time
    });
    // Test for getting all JavaScript files in a directory
    it('should get all JavaScript files in a directory', () => {
        // Mock the file system
        fs.readdirSync.mockReturnValue(['file1.js', 'file2.txt', 'folder']);
        fs.statSync.mockImplementation((filePath) => {
            if (filePath === path.join(testDir, 'file1.js')) {
                return { isDirectory: () => false };
            }
            if (filePath === path.join(testDir, 'file2.txt')) {
                return { isDirectory: () => false };
            }
            return { isDirectory: () => true }; // Simulate a folder
        });
        // Call the function
        const files = (0, ramp_up_metric_1.getJavaScriptFiles)(testDir);
        // Assert the result
        expect(files).toEqual([path.join(testDir, 'file1.js')]);
    });
    // Test for calculating total time from a GitHub repository
    it('should calculate total time from a GitHub repository', () => {
        // Mocking the necessary functions
        child_process_1.execSync.mockImplementation(() => { });
        fs.readFileSync.mockReturnValue(`
            function add(a, b) {
                return a + b;
            }
        `);
        // Mock getJavaScriptFiles to return a specific file
        fs.readdirSync.mockReturnValue(['file1.js']);
        fs.statSync.mockImplementation((filePath) => {
            return { isDirectory: () => false };
        });
        // Call the main function
        const result = (0, ramp_up_metric_1.calculateTotalTimeFromRepo)(testUrl);
        // Assert the result is valid
        expect(result).toBeLessThan(1); // Assuming time_max is set to 100
    });
    // Test for handling errors during repository cloning
    it('should handle errors during repository cloning', () => {
        // Mock execSync to throw an error
        child_process_1.execSync.mockImplementation(() => {
            throw new Error('Clone failed');
        });
        // Call the function and expect an error
        expect(() => {
            (0, ramp_up_metric_1.calculateTotalTimeFromRepo)(testUrl);
        }).toThrow('Clone failed');
    });
});
//# sourceMappingURL=ramp_up_metric.test.js.map