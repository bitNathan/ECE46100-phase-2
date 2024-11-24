// This component allows users to upload a new package.

import React, { useState } from 'react';
import { getPackagesByRegEx } from '../services/api';

const SearchPackagesByRegex: React.FC = () => {
  const [regex, setRegex] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await getPackagesByRegEx(regex);
      alert('Packages fetched successfully!');
    } catch (error) {
      console.error('Error fetching package:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Regex"
        value={regex}
        onChange={(e) => setRegex(e.target.value)}
      />
      <button type="submit">Fetch Package</button>
    </form>
  );
};

export default SearchPackagesByRegex;