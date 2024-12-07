import React, { useState } from 'react';
import UploadForm from './components/UploadForm';
import PackageList from './components/PackageList';
import PackageVersion from './components/PackageVersion';
import DownloadPackage from './components/DownloadPackage';
import SearchPackagesByRegex from './components/SearchPackagesByRegex';
import RecommendForm from './components/RecommendForm';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('UploadForm');

  return (
    <div>
      <h1>Trustworthy Module Registry</h1>
      <div style={{ display: 'flex', cursor: 'pointer' }}>
        <div onClick={() => setActiveTab('UploadForm')} style={{ padding: '10px', borderBottom: activeTab === 'UploadForm' ? '2px solid blue' : 'none'}}>Upload Form</div>
        <div onClick={() => setActiveTab('PackageList')} style={{ padding: '10px', borderBottom: activeTab === 'PackageList' ? '2px solid blue' : 'none'}}>Package List</div>
        <div onClick={() => setActiveTab('PackageVersion')} style={{ padding: '10px', borderBottom: activeTab === 'PackageVersion' ? '2px solid blue' : 'none'}}>Package Version</div>
        <div onClick={() => setActiveTab('DownloadPackage')} style={{ padding: '10px', borderBottom: activeTab === 'DownloadPackage' ? '2px solid blue' : 'none'}}>Download Package</div>
        <div onClick={() => setActiveTab('SearchPackagesByRegex')} style={{ padding: '10px', borderBottom: activeTab === 'SearchPackagesByRegex' ? '2px solid blue' : 'none'}}>Search Packages</div>
        <div onClick={() => setActiveTab('Recommend')} style={{ padding: '10px', borderBottom: activeTab === 'Recommend' ? '2px solid blue' : 'none'}}>Recommend</div>
      </div>
      <div style={{ marginTop: '20px' }}>
        {activeTab === 'UploadForm' && <UploadForm />}
        {activeTab === 'PackageList' && <PackageList />}
        {activeTab === 'PackageVersion' && <PackageVersion />}
        {activeTab === 'DownloadPackage' && <DownloadPackage />}
        {activeTab === 'SearchPackagesByRegex' && <SearchPackagesByRegex />}
        {activeTab === 'Recommend' && <RecommendForm />}
      </div>
    </div>
  );
};

export default App;
