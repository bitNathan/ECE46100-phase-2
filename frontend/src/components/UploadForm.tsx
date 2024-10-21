// This component allows users to upload a new package.

import React, { useState } from 'react';
import { uploadPackage } from '../services/api';

const UploadForm: React.FC = () => {
  const [packageName, setPackageName] = useState('');
  const [version, setVersion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [debloat, setDebloat] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (file) {
      await uploadPackage(packageName, version, file, debloat);
      alert('Package uploaded successfully!');
    } else {
      alert('Please select a file.');
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
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <label>
        Debloat:
        <input
          type="checkbox"
          checked={debloat}
          onChange={(e) => setDebloat(e.target.checked)}
        />
      </label>
      <button type="submit">Upload Package</button>
    </form>
  );
};

export default UploadForm;