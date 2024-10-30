import React from 'react';
import PackageList from './components/PackageList';
import UploadForm from './components/UploadForm';

const App: React.FC = () => {
  return (
    <div>
      <h1>Trustworthy Module Registry</h1>
      <UploadForm />
      <PackageList />
    </div>
  );
};

export default App;
