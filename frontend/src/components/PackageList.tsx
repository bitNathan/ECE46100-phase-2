// This component lists the available packages.

import React, { useEffect, useState } from 'react';
import { getPackages } from '../services/api';

// Define the Package interface to type the package data
interface Package {
  Version: string;
  Name: string;
  ID: string;
}

// Define the PackageList component
const PackageList: React.FC = () => {
  // State to store the list of packages
  const [packages, setPackages] = useState<Package[]>([]);
  // State to store the current offset for pagination
  const [offset, setOffset] = useState<number>(0);
  // State to indicate loading status
  const [loading, setLoading] = useState<boolean>(false);

  // Function to fetch packages from the API
  const fetchPackages = (offset: number) => {
    setLoading(true);
    getPackages(offset).then((data) => {
      setPackages(data);
      setLoading(false);
    });
  };

  // Function to increment the offset
  const incrementOffset = () => {
    setOffset((prevOffset) => prevOffset + 1);
  };

  // Function to decrement the offset
  const decrementOffset = () => {
    setOffset((prevOffset) => (prevOffset > 0 ? prevOffset - 1 : 0));
  };

  // useEffect to fetch packages when the component mounts or offset changes
  useEffect(() => {
    fetchPackages(offset);
  }, [offset]);

  return (
    <div>
      <h2>Available Packages</h2>
      <p><i>10 Packages per page </i></p>
      <p><i> Sorted by ID</i></p>
      <div>
        <button onClick={decrementOffset} disabled={offset === 0}>
          Previous
        </button>
        <span>Page: {offset + 1}</span>
        <button onClick={incrementOffset}>
          Next
        </button>
        <br />
        <br />
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid black', padding: '8px' }}>Version</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Name</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>ID</th>
            </tr>
          </thead>
          <tbody>
            {/* Map over the packages and display each one in a table row */}
            {packages.map((pkg: Package) => (
              <tr key={pkg.ID}>
                <td style={{ border: '1px solid black', padding: '8px' }}>{pkg.Version}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{pkg.Name}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{pkg.ID}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PackageList;
