import { packageCostHandler } from '../routes/packageCost';

// Mock the database connection
jest.mock('../routes/db', () => ({
  __esModule: true,
  default: Promise.resolve({
    execute: jest.fn()
  })
}));

describe('packageCostHandler', () => {
  let mockDb: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDb = await (jest.requireMock('../routes/db').default);
  });

  // Test 400 - Missing Package ID
  it('should return 400 if package ID is missing', async () => {
    const response = await packageCostHandler('');
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe('Missing field(s) in PackageID');
  });

  // Test 404 - Package Not Found
  it('should return 404 if package does not exist', async () => {
    mockDb.execute.mockResolvedValueOnce({
      rows: []
    });
    
    const response = await packageCostHandler('123');
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).error).toBe('Package does not exist');
  });

  // Test 200 - Without Dependencies
  it('should return 200 with package cost without dependencies', async () => {
    // Create a larger mock content (1MB of 'A' characters)
    const mockContent = 'A'.repeat(1024 * 1024);
    const base64Content = Buffer.from(mockContent).toString('base64');
    
    const mockPackage = {
      id: '123',
      content: base64Content,
      dependencies: null
    };

    mockDb.execute.mockResolvedValueOnce({
      rows: [mockPackage]
    });

    const response = await packageCostHandler('123', false);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('123');
    expect(body['123']).toHaveProperty('totalCost');
    expect(typeof body['123'].totalCost).toBe('number');
    expect(body['123'].totalCost).toBeGreaterThan(0);
    // Should not have standaloneCost when dependencies not requested
    expect(body['123']).not.toHaveProperty('standaloneCost');
  });

  // Test 200 - With Dependencies
  it('should return 200 with package cost including dependencies', async () => {
    // Create mock contents (~1MB each)
    const mockContent = 'A'.repeat(1024 * 1024);
    const base64Content = Buffer.from(mockContent).toString('base64');
    const mockDepContent = 'B'.repeat(1024 * 1024);
    const base64DepContent = Buffer.from(mockDepContent).toString('base64');

    const mockPackage = {
      id: '123',
      content: base64Content,
      dependencies: 'dep1,dep2'
    };

    const mockDep1 = {
      id: 'dep1',
      content: base64DepContent
    };

    const mockDep2 = {
      id: 'dep2',
      content: base64DepContent
    };

    // Mock main package query
    mockDb.execute.mockResolvedValueOnce({
      rows: [mockPackage]
    });

    // Mock dependencies query
    mockDb.execute.mockResolvedValueOnce({
      rows: [{ dependencies: 'dep1,dep2' }]
    });

    // Mock individual dependency queries
    mockDb.execute
      .mockResolvedValueOnce({
        rows: [mockDep1]
      })
      .mockResolvedValueOnce({
        rows: [mockDep2]
      });

    const response = await packageCostHandler('123', true);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('123');
    expect(body['123']).toHaveProperty('totalCost');
    expect(body['123']).toHaveProperty('standaloneCost');
    expect(typeof body['123'].totalCost).toBe('number');
    expect(typeof body['123'].standaloneCost).toBe('number');
    expect(body['123'].totalCost).toBeGreaterThan(0);
    expect(body['123'].standaloneCost).toBeGreaterThan(0);
    expect(body['123'].totalCost).toBeGreaterThan(body['123'].standaloneCost);
  });

  // Test 500 - Database Error
  it('should return 500 if there is a database error', async () => {
    mockDb.execute.mockRejectedValueOnce(new Error('Database error'));
    
    const response = await packageCostHandler('123');
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Internal server error');
  });

  // Test 500 - Dependency Calculation Error
  it('should return 500 if dependency calculation fails', async () => {
    const mockPackage = {
      id: '123',
      content: Buffer.from('A'.repeat(1024)).toString('base64'),
      dependencies: 'dep1'
    };

    // Mock main package query success
    mockDb.execute.mockResolvedValueOnce({
      rows: [mockPackage]
    });

    // Mock dependencies query to throw error
    mockDb.execute.mockRejectedValueOnce(new Error('Failed to get dependencies'));

    const response = await packageCostHandler('123', true);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Failed to calculate dependency costs');
  });

  // Test Package with No Dependencies
  it('should handle package with no dependencies correctly', async () => {
    const mockContent = Buffer.from('A'.repeat(1024 * 1024)).toString('base64');
    const mockPackage = {
      id: '123',
      content: mockContent,
      dependencies: ''
    };

    mockDb.execute.mockResolvedValueOnce({
      rows: [mockPackage]
    });

    // Mock empty dependencies result
    mockDb.execute.mockResolvedValueOnce({
      rows: [{ dependencies: '' }]
    });

    const response = await packageCostHandler('123', true);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body['123'].totalCost).toBeGreaterThan(0);
    expect(body['123'].totalCost).toBe(body['123'].standaloneCost);
  });
});