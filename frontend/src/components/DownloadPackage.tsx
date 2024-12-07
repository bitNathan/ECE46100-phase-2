import React, { useState } from 'react';
import { downloadPackage, downloadPackageByNameVersion } from '../services/api';

const DownloadPackage: React.FC = () => {
  const [packageName, setPackageName] = useState('');
  const [packageVersion, setPackageVersion] = useState('');
  const [packageId, setPackageId] = useState(''); // New state for ID-based download
  const [packageData, setPackageData] = useState<any>(null);

  const handleDownloadByNameVersion = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!packageName || !packageVersion) {
      alert('Please provide both Package Name and Version.');
      return;
    }

    try {
      const response = await downloadPackageByNameVersion(packageName, packageVersion);
      setPackageData(response);

      // Extract data for download
      const { Content } = response.data;
      if (!Content) {
        alert('No content available for download.');
        return;
      }

      // Decode base64 content
      const binaryData = atob(Content);
      const arrayBuffer = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        arrayBuffer[i] = binaryData.charCodeAt(i);
      }

      // Create a blob and initiate download
      const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${packageName}-${packageVersion}.tgz`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Package Not Found or Error Occurred.');
      console.error('Error:', error);
    }
  };

  const handleDownloadById = async (event: React.FormEvent) => {
    event.preventDefault();
  
    if (!packageId) {
      alert('Please provide a Package ID.');
      return;
    }
  
    try {
      const response = await downloadPackage(packageId);
      setPackageData(response);
  
      // Extract data and metadata
      const { Content } = response.data;
      const { Name, Version } = response.metadata;
  
      if (!Content) {
        alert('No content available for download.');
        return;
      }
  
      // Decode base64 content
      const binaryData = atob(Content);
      const arrayBuffer = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        arrayBuffer[i] = binaryData.charCodeAt(i);
      }
  
      // Create a blob and initiate download
      const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${Name}-${Version}.tgz`); // Use Name-Version format for filename
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Package Not Found or Error Occurred.');
      console.log('Error:', error);
    }
  };
  

  return (
    <div>
      <form onSubmit={handleDownloadByNameVersion}>
        <h3>Download by Name and Version</h3>
        <input
          type="text"
          placeholder="Package Name"
          value={packageName}
          onChange={(e) => setPackageName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Package Version"
          value={packageVersion}
          onChange={(e) => setPackageVersion(e.target.value)}
          required
        />
        <button type="submit">Download Package</button>
      </form>

      <form onSubmit={handleDownloadById}>
        <h3>Download by Package ID</h3>
        <input
          type="text"
          placeholder="Package ID"
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
          required
        />
        <button type="submit">Download Package</button>
      </form>

      {packageData && (
        <div>
          <h3>Package Metadata:</h3>
          <p>Name: {packageData.metadata.Name}</p>
          <p>Version: {packageData.metadata.Version}</p>
          <p>ID: {packageData.metadata.ID}</p>
        </div>
      )}
    </div>
  );
};

export default DownloadPackage;
