import React, { useState } from 'react';

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

const METRIC_THRESHOLD = 0.5;

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
      const response = await fetch(`/api/package/${packageId}/rate`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received rating:', data);
      setRating(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isMetricValid = (value: number) => value >= METRIC_THRESHOLD;
  
  const allMetricsValid = rating ? 
    Object.entries(rating)
      .filter(([key]) => !key.includes('Latency'))
      .every(([_, value]) => isMetricValid(value)) 
    : false;

  return (
    <div className="p-4">
      <h2>Package Rating</h2>
      
      <form onSubmit={handleSubmit} className="mb-5">
        <div className="mb-3">
          <label htmlFor="packageId" className="block mb-2">
            Package ID:
          </label>
          <input
            id="packageId"
            type="text"
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className="px-3 py-2 w-[300px] mr-3 border rounded"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {loading ? 'Loading...' : 'Get Rating'}
        </button>
      </form>

      {error && (
        <div className="p-3 mb-5 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      {rating && (
        <div className="p-5 border rounded">
          <h3>Rating Results</h3>
          
          {/* Ingestion Status Banner */}
          <div className={`p-3 mb-5 rounded ${
            allMetricsValid 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {allMetricsValid 
              ? '✅ Package meets all ingestion criteria (all metrics ≥ 0.5)'
              : '⚠️ Package does not meet ingestion criteria (all metrics must be ≥ 0.5)'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <h4 className="mb-3">Metrics</h4>
              <table className="w-full">
                <tbody>
                  {Object.entries(rating)
                    .filter(([key]) => !key.includes('Latency'))
                    .map(([key, value]) => (
                      <tr key={key} className="border-b">
                        <td className="py-2">
                          {key}
                          {!isMetricValid(value) && (
                            <span className="ml-2 text-red-500 text-sm">
                              (Below threshold)
                            </span>
                          )}
                        </td>
                        <td className={`py-2 text-right ${
                          isMetricValid(value) ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {value.toFixed(5)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="mb-3">Latencies (seconds)</h4>
              <table className="w-full">
                <tbody>
                  {Object.entries(rating)
                    .filter(([key]) => key.includes('Latency'))
                    .map(([key, value]) => (
                      <tr key={key} className="border-b">
                        <td className="py-2">{key.replace('Latency', '')}</td>
                        <td className="py-2 text-right">
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