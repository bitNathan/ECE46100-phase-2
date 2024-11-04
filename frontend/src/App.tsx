import React, { useState } from 'react';
import UploadForm from './components/UploadForm';
import PackageList from './components/PackageList';
import PackageVersion from './components/PackageVersion';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('UploadForm');

  return (
    <div>
      <h1>Trustworthy Module Registry</h1>
      
      {/* Tab Headers */}
      <div style={{ display: 'flex', cursor: 'pointer' }}>
        <div onClick={() => setActiveTab('UploadForm')} style={{ padding: '10px', borderBottom: activeTab === 'UploadForm' ? '2px solid blue' : 'none' }}>
          Upload Form
        </div>
        <div onClick={() => setActiveTab('PackageList')} style={{ padding: '10px', borderBottom: activeTab === 'PackageList' ? '2px solid blue' : 'none' }}>
          Package List
        </div>
        <div onClick={() => setActiveTab('PackageVersion')} style={{ padding: '10px', borderBottom: activeTab === 'PackageVersion' ? '2px solid blue' : 'none' }}>
          Package Version
        </div>
      </div>
      
      {/* Tab Content */}
      <div style={{ marginTop: '20px' }}>
        {activeTab === 'UploadForm' && <UploadForm />}
        {activeTab === 'PackageList' && <PackageList />}
        {activeTab === 'PackageVersion' && <PackageVersion />}
      </div>
    </div>
  );
};

export default App;
