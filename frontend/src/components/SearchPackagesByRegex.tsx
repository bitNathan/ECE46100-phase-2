import React, { useState } from 'react';
import { getPackagesByRegEx } from '../services/api';

const SearchPackagesByRegex: React.FC = () => {
  const [regex, setRegex] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCurrentPage(0);  // Reset to first page
    setIsLoading(true);

    try {
      const data = await getPackagesByRegEx(regex);
      setSearchResults(data || []);
      alert('Packages fetched successfully!');
    } catch (error) {
      console.error('Error fetching package:', error);
      setSearchResults([]);
      alert('Failed to fetch packages');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate the current items to display
  const indexOfLastItem = (currentPage + 1) * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = (searchResults || []).slice(indexOfFirstItem, indexOfLastItem);

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
    <div className="p-4">
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          placeholder="Enter Regex"
          value={regex}
          onChange={(e) => setRegex(e.target.value)}
          className="border p-2 mr-2"
        />
        <button 
          type="submit" 
          disabled={isLoading}
          className="bg-blue-500 text-white p-2 rounded"
        >
          {isLoading ? 'Searching...' : 'Search Packages'}
        </button>
      </form>

      {currentItems.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-2"
          style={{ padding: '10px' }}>Package Metadata:</h3>
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
        <div className="flex justify-between mt-4" style={{ marginTop: '10px' }}>
          <button 
            onClick={handlePrevious} 
            disabled={currentPage === 0}
            className="bg-gray-300 p-2 rounded disabled:opacity-50"
            style={{ marginRight: '5px' }}
          >
            Previous
          </button>
          <span className="self-center">
            Page {currentPage + 1} of {Math.ceil(searchResults.length / itemsPerPage)}
          </span>
          <button 
            onClick={handleNext} 
            disabled={indexOfLastItem >= searchResults.length}
            className="bg-gray-300 p-2 rounded disabled:opacity-50"
            style={{ marginLeft: '5px' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchPackagesByRegex;