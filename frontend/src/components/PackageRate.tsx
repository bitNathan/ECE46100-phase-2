import React, { useState } from 'react';
import { ratePackage } from '../services/api'; // Import the function from api.ts

interface RatingResponse {
  RampUp: number;
  Correctness: number;
  BusFactor: number;
  ResponsiveMaintainer: number;
  LicenseScore: number;
  GoodPinningPractice: number;
  PullRequest: number;
  NetScore: number;
  RampUpLatency: number;
  CorrectnessLatency: number;
  BusFactorLatency: number;
  ResponsiveMaintainerLatency: number;
  LicenseScoreLatency: number;
  GoodPinningPracticeLatency: number;
  PullRequestLatency: number;
  NetScoreLatency: number;
}

const PackageRate: React.FC = () => {
  const [packageId, setPackageId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<RatingResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRating(null);

    try {
      console.log('Requesting rating for package:', packageId);
      const data = await ratePackage(packageId);

      if (!data) {
        throw new Error('Failed to fetch package rating.');
      }

      console.log('Received rating:', data);
      setRating(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2>Package Rating</h2>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="packageId" style={{ display: 'block', marginBottom: '5px' }}>
            Package ID:
          </label>
          <input
            id="packageId"
            type="text"
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            style={{ 
              padding: '5px',
              width: '300px',
              marginRight: '10px'
            }}
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#cccccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Get Rating'}
        </button>
      </form>

      {error && (
        <div style={{ 
          padding: '10px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {rating && (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <h3>Rating Results</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4>Metrics</h4>
              <table style={{ width: '100%' }}>
                <tbody>
                  {Object.entries(rating)
                    .filter(([key]) => !key.includes('Latency'))
                    .map(([key, value]) => (
                      <tr key={key} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px 0' }}>{key}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>
                          {value.toFixed(5)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div>
              <h4>Latencies (seconds)</h4>
              <table style={{ width: '100%' }}>
                <tbody>
                  {Object.entries(rating)
                    .filter(([key]) => key.includes('Latency'))
                    .map(([key, value]) => (
                      <tr key={key} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px 0' }}>{key.replace('Latency', '')}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>
                          {value.toFixed(3)}s
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageRate;
