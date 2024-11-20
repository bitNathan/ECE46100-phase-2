// This component allows users to upload a new package.

import React, { useState } from 'react';
import { fetchPackageVersion } from '../services/api';

const PackageVersion: React.FC = () => {
  const [packageName, setPackageName] = useState('');
  const [version, setVersion] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!packageName) {
      alert('Please provide the package name!');
      return;
    }

    try {
      await fetchPackageVersion(packageName, version);
      alert('Package version fetched successfully!');
    } catch (error) {
      console.error('Error uploading package:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Package Name"
        value={packageName}
        onChange={(e) => setPackageName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Version"
        value={version}
        onChange={(e) => setVersion(e.target.value)}
      />
      <button type="submit">Fetch Package</button>
    </form>
  );
};

export default PackageVersion;