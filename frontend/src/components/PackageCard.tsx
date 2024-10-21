// This component displays individual package details.

import React from 'react';
import { ratePackage, downloadPackage, getPackageCost } from '../services/api';

interface PackageCardProps {
  pkg: {
    ID: string;
    Name: string;
    Version: string;
  };
}

const PackageCard: React.FC<PackageCardProps> = ({ pkg }) => {
  const handleRate = async () => {
    const rating = await ratePackage(pkg.ID);
    if (rating) {
      alert(`Package Rating: ${rating.netScore}`);
    }
  };

  const handleDownload = async () => {
    await downloadPackage(pkg.ID);
  };

  const handleCost = async () => {
    const cost = await getPackageCost(pkg.ID);
    if (cost) {
      alert(`Package Cost: ${cost.totalCost}`);
    }
  };

  return (
    <div className="package-card">
      <h3>{pkg.Name}</h3>
      <p>Version: {pkg.Version}</p>
      <button onClick={handleRate}>Rate Package</button>
      <button onClick={handleDownload}>Download Package</button>
      <button onClick={handleCost}>Get Package Cost</button>
    </div>
  );
};

export default PackageCard;