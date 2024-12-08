import React, { useState } from 'react';
import UploadPackage from './components/UploadPackage';
import PackageList from './components/PackageList';
import PackageVersion from './components/PackageVersion';
import PackageRate from './components/PackageRate';
import PackageCost from './components/PackageCost';
import DownloadPackage from './components/DownloadPackage';
import SearchPackagesByRegex from './components/SearchPackagesByRegex';
import RecommendForm from './components/RecommendForm';
import UpdatePackage from './components/UpdatePackage';
import { resetRegistry } from './services/api'; // Import the reset function

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('UploadPackage');

  const handleReset = async () => {
    const confirmation = window.confirm('Are you sure you want to reset the registry? This action cannot be undone.');
    if (confirmation) {
      try {
        await resetRegistry();
      } catch (error) {
        console.error('Error resetting registry:', error);
      }
    }
  };

  return (
    <div>
      <h1>Trustworthy Module Registry</h1>
      {/* Tab Headers */}
      <div style={{ display: 'flex', cursor: 'pointer' }}>
        <div onClick={() => setActiveTab('UploadPackage')} style={{ padding: '10px', borderBottom: activeTab === 'UploadPackage' ? '2px solid blue' : 'none' }}>Upload Form</div>
        <div onClick={() => setActiveTab('PackageList')} style={{ padding: '10px', borderBottom: activeTab === 'PackageList' ? '2px solid blue' : 'none' }}>Package List</div>
        <div onClick={() => setActiveTab('PackageVersion')} style={{ padding: '10px', borderBottom: activeTab === 'PackageVersion' ? '2px solid blue' : 'none' }}>Package Version</div>
        <div onClick={() => setActiveTab('DownloadPackage')} style={{ padding: '10px', borderBottom: activeTab === 'DownloadPackage' ? '2px solid blue' : 'none' }}>Download Package</div>
        <div onClick={() => setActiveTab('SearchPackagesByRegex')} style={{ padding: '10px', borderBottom: activeTab === 'SearchPackagesByRegex' ? '2px solid blue' : 'none' }}>Search Packages</div>
        <div onClick={() => setActiveTab('Recommend')} style={{ padding: '10px', borderBottom: activeTab === 'Recommend' ? '2px solid blue' : 'none' }}>Recommend</div>
        <div onClick={() => setActiveTab('UpdatePackage')} style={{ padding: '10px', borderBottom: activeTab === 'UpdatePackage' ? '2px solid blue' : 'none' }}>Update Package</div>
        <div onClick={() => setActiveTab('PackageRate')} style={{ padding: '10px', borderBottom: activeTab === 'PackageRate' ? '2px solid blue' : 'none' }}>Package Rating</div>
        <div onClick={() => setActiveTab('PackageCost')} style={{ padding: '10px', borderBottom: activeTab === 'PackageCost' ? '2px solid blue' : 'none' }}>Package Cost</div>
        <div onClick={handleReset} style={{ padding: '10px', color: 'red', cursor: 'pointer' }}>Reset Registry</div>
      </div>
      <div style={{ marginTop: '20px' }}>
        {activeTab === 'UploadPackage' && <UploadPackage />}
        {activeTab === 'PackageList' && <PackageList />}
        {activeTab === 'PackageVersion' && <PackageVersion />}
        {activeTab === 'PackageRate' && <PackageRate />}
        {activeTab === 'PackageCost' && <PackageCost />}
        {activeTab === 'DownloadPackage' && <DownloadPackage />}
        {activeTab === 'SearchPackagesByRegex' && <SearchPackagesByRegex />}
        {activeTab === 'Recommend' && <RecommendForm />}
        {activeTab === 'UpdatePackage' && <UpdatePackage />}
      </div>
    </div>
  );
};

export default App;