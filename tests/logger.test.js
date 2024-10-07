"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../src/logger"));
const config_env_1 = __importDefault(require("../src/config_env"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// 4 test cases
// Mocking the fs module
jest.mock('fs');
describe('Logger', () => {
    beforeEach(() => {
        // Reset the mock implementation before each test
        jest.clearAllMocks();
        // Mock the log level and log file path
        config_env_1.default.LOG_LEVEL = 2; // Set to DEBUG level for testing
        config_env_1.default.LOG_FILE = './test_log.txt'; // Use a test log file
    });
    it('should create the log directory if it does not exist', () => {
        // Mock fs.existsSync to return false to simulate directory not existing
        fs_1.default.existsSync.mockReturnValue(false);
        // Call the debug method
        logger_1.default.debug('Test debug message');
        // Assert that the directory creation was called
        expect(fs_1.default.mkdirSync).toHaveBeenCalledWith(path_1.default.dirname(config_env_1.default.LOG_FILE));
    });
    it('should write a message to the log file on the first write', () => {
        // Mock fs.existsSync to return true to simulate directory existing
        fs_1.default.existsSync.mockReturnValue(true);
        // Mock the file write method
        const message = 'Test info message';
        fs_1.default.writeFileSync.mockImplementation(() => { });
        // Call the info method
        logger_1.default.info(message);
        // Assert that writeFileSync was called with the correct parameters
        expect(fs_1.default.writeFileSync).toHaveBeenCalledWith(config_env_1.default.LOG_FILE, message + "\n");
    });
    it('should append a message to the log file after the first write', () => {
        // Mock fs.existsSync to return true to simulate directory existing
        fs_1.default.existsSync.mockReturnValue(true);
        // Simulate first write completed
        logger_1.default.info('Initial write');
        // Mock the file append method
        const message = 'Test debug message';
        fs_1.default.appendFileSync.mockImplementation(() => { });
        // Call the debug method again
        logger_1.default.debug(message);
        // Assert that appendFileSync was called with the correct parameters
        expect(fs_1.default.appendFileSync).toHaveBeenCalledWith(config_env_1.default.LOG_FILE, message + "\n");
    });
    it('should not log messages if log level is SILENT', () => {
        // Set log level to SILENT
        config_env_1.default.LOG_LEVEL = 0;
        // Call the debug method
        logger_1.default.debug('This should not be logged');
        // Assert that neither writeFileSync nor appendFileSync was called
        expect(fs_1.default.writeFileSync).not.toHaveBeenCalled();
        expect(fs_1.default.appendFileSync).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=logger.test.js.map