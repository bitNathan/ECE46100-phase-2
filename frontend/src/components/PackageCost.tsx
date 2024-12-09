import React, { useState } from 'react';
import { getPackageCost } from '../services/api';

interface PackageCostInfo {
  standaloneCost?: number;
  totalCost: number;
}

interface PackageCostResponse {
  [key: string]: PackageCostInfo;
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
      // Pass the `includeDependencies` flag to `getPackageCost`
      const response = await getPackageCost(packageId, includeDependencies);
  
      if (!response) {
        throw new Error('Failed to fetch package cost.');
      }
  
      console.log('Cost data:', response);
      setCost(response);
    } catch (err) {
      console.error('Error fetching cost:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const mainPackageKey = packageId && cost && Object.keys(cost).find(key => key === packageId);
  const dependencyEntries = cost
    ? Object.entries(cost).filter(([key]) => key !== packageId)
    : [];

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

          {/* Main Package Section */}
          {mainPackageKey && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Main Package: {mainPackageKey}</h4>
              <table className="w-full border-collapse">
                <tbody>
                  {cost[mainPackageKey]?.standaloneCost !== undefined && (
                    <tr className="border-b">
                      <td className="py-2 font-medium">Standalone Cost</td>
                      <td className="py-2 text-right">
                        {cost[mainPackageKey].standaloneCost.toFixed(2)} MB
                      </td>
                    </tr>
                  )}
                  {cost[mainPackageKey]?.totalCost !== undefined && (
                    <tr className="border-b">
                      <td className="py-2 font-medium">Total Cost</td>
                      <td className="py-2 text-right">
                        {cost[mainPackageKey].totalCost.toFixed(2)} MB
                      </td>
                    </tr>
                  )}
                  {cost[mainPackageKey]?.standaloneCost === undefined && cost[mainPackageKey]?.totalCost === undefined && (
                    <tr>
                      <td className="py-2" colSpan={2}>
                        No cost data available for the main package.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Dependencies Section */}
          {includeDependencies && dependencyEntries.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Dependencies</h4>
              {dependencyEntries.map(([id, costs]) => {
                const standaloneCost = costs?.standaloneCost !== undefined ? costs.standaloneCost.toFixed(2) : null;
                const totalCost = costs?.totalCost !== undefined ? costs.totalCost.toFixed(2) : null;

                return (
                  <div key={id} className="mb-4 bg-gray-50 p-4 rounded">
                    <h5 className="font-medium mb-2">{id}</h5>
                    <table className="w-full border-collapse">
                      <tbody>
                        {standaloneCost && (
                          <tr className="border-b">
                            <td className="py-2">Standalone Cost</td>
                            <td className="py-2 text-right">{standaloneCost} MB</td>
                          </tr>
                        )}
                        {totalCost && (
                          <tr className="border-b">
                            <td className="py-2">Total Cost</td>
                            <td className="py-2 text-right">{totalCost} MB</td>
                          </tr>
                        )}
                        {!standaloneCost && !totalCost && (
                          <tr>
                            <td className="py-2" colSpan={2}>
                              No cost data available for this dependency.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}

          {!includeDependencies && dependencyEntries.length === 0 && !mainPackageKey && (
            <div className="text-gray-600">No cost data available for the provided package.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PackageCost;
