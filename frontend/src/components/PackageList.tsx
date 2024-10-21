// This component lists the available packages.

import React, { useEffect, useState } from 'react';
import { getPackages } from '../services/api';
import PackageCard from './PackageCard';

interface Package {
  ID: string;
  Name: string;
  Version: string;
}

const PackageList: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);

  useEffect(() => {
    getPackages().then((data) => {
      setPackages(data);
    });
  }, []);

  return (
    <div>
      <h2>Available Packages</h2>
      <div>
        {packages.map((pkg) => (
          <PackageCard key={pkg.ID} pkg={pkg} />
        ))}
      </div>
    </div>
  );
};

export default PackageList;
