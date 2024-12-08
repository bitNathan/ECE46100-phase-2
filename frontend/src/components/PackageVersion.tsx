import React, { useState } from 'react';
import { fetchPackageVersion } from '../services/api';

const PackageVersion: React.FC = () => {
  const [packageName, setPackageName] = useState('');
  const [version, setVersion] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(4);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setCurrentPage(0);
    setIsLoading(true);

    try {
      const data = await fetchPackageVersion(packageName, version);
      
       // Ensure data is an array and filter out null/undefined items
       const resultsArray = (Array.isArray(data) ? data : [data])
       .filter(item => item != null)
       .map(item => ({
         Name: item?.Name || 'N/A',
         Version: item?.Version || 'N/A',
         ID: item?.ID || 'N/A'
       }));
      
      setSearchResults(resultsArray);
      
      if (resultsArray.length > 0) {
        alert('Package version(s) fetched successfully!');
      } else {
        alert('No package versions found.');
      }
    } catch (error) {
      console.error('Error fetching package version:', error);
      alert('Failed to fetch package version');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate the current items to display
  const indexOfLastItem = (currentPage + 1) * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = searchResults.slice(indexOfFirstItem, indexOfLastItem);

  // Pagination handlers
  const handleNext = () => {
    if (indexOfLastItem < searchResults.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-xl">
      <form onSubmit={handleSubmit} className="mb-6 flex space-x-2">
        <input
          type="text"
          placeholder="Package Name"
          value={packageName}
          onChange={(e) => setPackageName(e.target.value)}
          className="flex-grow p-3 border-2 border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          required
        />
        <input
          type="text"
          placeholder="Version"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          className="p-3 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        <button 
          type="submit" 
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-3 rounded-r-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Searching...' : 'Fetch'}
        </button>
      </form>

      {currentItems.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 pb-2"
           style={{ padding: '10px' }}>
            Package Version Results:
          </h3>
          {currentItems.map((result, index) => (
            <div 
              key={index} 
              style={{ padding: '10px', border: '1px solid #ccc', margin: '5px' }}
              className="border p-2 mb-2 bg-gray-100 rounded"
            >
              <p><strong>Name:</strong> {result.Name}</p>
              <p><strong>Version:</strong> {result.Version}</p>
              <p><strong>ID:</strong> {result.ID}</p>
            </div>
          ))}
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="flex justify-between items-center mt-6 bg-gray-100 p-3 rounded-lg"
        style={{ marginTop: '10px' }}>
          <button 
            onClick={handlePrevious} 
            disabled={currentPage === 0}
            style={{ marginRight: '5px' }}
          >
            Previous
          </button>
          <span className="text-gray-700 font-medium">
            Page {currentPage + 1} of {Math.ceil(searchResults.length / itemsPerPage)}
          </span>
          <button 
            onClick={handleNext} 
            disabled={indexOfLastItem >= searchResults.length}
            style={{ marginLeft: '5px' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PackageVersion;