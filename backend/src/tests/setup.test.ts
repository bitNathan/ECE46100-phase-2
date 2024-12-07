// Store original console methods before mocking
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn
  };
  
  // Setup console mocks before all tests
  beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });
  
  // Restore original console methods after all tests complete
  afterAll(() => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });
  
  // Clear mock data before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Add a dummy test to satisfy Jest requirements
  describe('Console Setup', () => {
    it('should mock console methods', () => {
      console.log('test');
      console.error('test');
      console.warn('test');
      
      expect(console.log).toHaveBeenCalledWith('test');
      expect(console.error).toHaveBeenCalledWith('test');
      expect(console.warn).toHaveBeenCalledWith('test');
    });
  });