import { packageRateHandler } from '../routes/packageRate';
import db from '../routes/connection';

// Mock the database connection
jest.mock('../routes/connection', () => ({
  promise: jest.fn().mockReturnValue({
    query: jest.fn(),
  }),
}));

describe('packageRateHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if package ID is missing', async () => {
    const response = await packageRateHandler('');
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe('Missing field(s) in PackageID');
  });

  it('should return 404 if package does not exist', async () => {
    (db.promise().query as jest.Mock).mockResolvedValue([[], []]);
    const response = await packageRateHandler('123');
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).error).toBe('Package does not exist');
  });

  // The rest of the tests remain the same, just remove the second argument (authToken)
  it('should return 200 with a valid package rating', async () => {
    const mockPackage = {
      id: '123',
      name: 'test-package',
      version: '1.0.0',
      upload_type: 'npm',
      dependencies: 'react:^17.0.2,lodash:4.17.21,express:~4.17.1',
      code_review_status: 'pending_changes',
      created_at: new Date(),
      updated_at: new Date()
    };
    (db.promise().query as jest.Mock).mockResolvedValue([[mockPackage]]);
    const response = await packageRateHandler('123');
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.rating).toHaveProperty('score');
    expect(body.rating.metrics).toHaveProperty('dependencyPinning', 0.33);
    expect(body.rating.metrics).toHaveProperty('codeReview', 0.5);
    expect(body.rating.score).toBe(0.4);
  });


  it('should handle packages with no dependencies correctly', async () => {
    const mockPackage = {
      id: '123',
      name: 'test-package',
      version: '1.0.0',
      upload_type: 'npm',
      dependencies: null,
      code_review_status: 'approved',
      created_at: new Date(),
      updated_at: new Date()
    };

    (db.promise().query as jest.Mock).mockResolvedValue([[mockPackage]]);
    
    const response = await packageRateHandler('123');
    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    // With no dependencies, dependencyPinning should be 1.0
    // And with 'approved' status, codeReview should be 1.0
    expect(body.rating.metrics).toHaveProperty('dependencyPinning', 1);
    expect(body.rating.metrics).toHaveProperty('codeReview', 1);
    expect(body.rating.score).toBe(1);
  });
});