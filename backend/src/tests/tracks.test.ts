jest.mock('../routes/db', () => ({
  getDBConnection: jest.fn().mockResolvedValue({ /* fake connection */ })
}));

import request from 'supertest';
import app from '../server';

describe('Tracks Route', () => {
  // Test GET /tracks endpoint
  describe('GET /tracks', () => {
    it('should return a list of planned tracks', async () => {
      const response = await request(app)
        .get('/tracks')
        .expect('Content-Type', /json/)
        .expect(200);

      // Check the structure of the response
      expect(response.body).toHaveProperty('plannedTracks');
      
      // Verify the content of the tracks
      expect(Array.isArray(response.body.plannedTracks)).toBe(true);
      expect(response.body.plannedTracks).toContain('ML inside track');
    });
  });

  // Error handling test (if applicable)
  describe('Error Handling', () => {
    it('should handle internal server errors gracefully', async () => {
        
    });
  });
});