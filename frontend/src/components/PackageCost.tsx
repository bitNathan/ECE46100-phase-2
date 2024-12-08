import React, { useState } from 'react';
import { getPackageCost } from '../services/api';

interface PackageCostResponse {
  [key: string]: {
    standaloneCost?: number;
    totalCost: number;
  };
}

const PackageCost: React.FC = () => {
  const [packageId, setPackageId] = useState('');
  const [includeDependencies, setIncludeDependencies] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cost, setCost] = useState<PackageCostResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCost(null);

    try {
      console.log(`Fetching cost for ${packageId}, dependencies: ${includeDependencies}`);
      const data = await getPackageCost(packageId); // Use the API function

      if (!data) {
        throw new Error('Failed to fetch package cost.');
      }

      console.log('Cost data:', data);
      setCost(data);
    } catch (err) {
      console.error('Error fetching cost:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Package Cost Calculator</h2>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label htmlFor="packageId" className="block mb-2">
            Package ID:
          </label>
          <input
            id="packageId"
            type="text"
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter package ID"
            required
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={includeDependencies}
              onChange={(e) => setIncludeDependencies(e.target.checked)}
              className="mr-2"
            />
            Include Dependencies
          </label>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Loading...' : 'Calculate Cost'}
        </button>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {cost && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl mb-4">Cost Results</h3>
          
          {Object.entries(cost).map(([id, costs]) => (
            <div key={id} className="mb-4">
              <h4 className="font-semibold">Package ID: {id}</h4>
              <table className="w-full mt-2">
                <tbody>
                  {costs.standaloneCost !== undefined && (
                    <tr className="border-b">
                      <td className="py-2">Standalone Cost</td>
                      <td className="py-2 text-right">{costs.standaloneCost.toFixed(2)} MB</td>
                    </tr>
                  )}
                  <tr className="border-b">
                    <td className="py-2">Total Cost</td>
                    <td className="py-2 text-right">{costs.totalCost.toFixed(2)} MB</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PackageCost;
