import React, { useState } from 'react';
import { updatePackage } from '../services/api';

const UpdatePackage: React.FC = () => {
  const [packageId, setPackageId] = useState('');
  const [packageName, setPackageName] = useState(''); // New Name field
  const [newVersion, setNewVersion] = useState('');
  const [content, setContent] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [jsProgram, setJsProgram] = useState('');
  const [debloat, setDebloat] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUrl(''); // Clear URL if file is selected
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip the data URL prefix
        const base64Content = result.split(',')[1];
        setContent(base64Content);
      };
      reader.readAsDataURL(file);
    } else {
      setContent(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!packageId || !packageName || !newVersion || (!content && !url)) {
      alert('Package ID, Name, Version, and either Content or URL are required.');
      return;
    }

    try {
      await updatePackage(packageId, newVersion, content, url, packageName, jsProgram, debloat);
    } catch (error) {
      console.log('Update error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Package ID"
        value={packageId}
        onChange={(e) => setPackageId(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Package Name"
        value={packageName}
        onChange={(e) => setPackageName(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="New Version (e.g., 1.0.1)"
        value={newVersion}
        onChange={(e) => setNewVersion(e.target.value)}
        required
      />
      <input
        type="file"
        onChange={handleFileChange}
        disabled={!!url}
      />
      <input
        type="text"
        placeholder="Package URL"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          if (e.target.value) {
            setContent(null); // Clear content if URL is entered
          }
        }}
        disabled={!!content}
      />
      <textarea
        placeholder="JSProgram"
        value={jsProgram}
        onChange={(e) => setJsProgram(e.target.value)}
      />
      <label>
        Debloat:
        <input
          type="checkbox"
          checked={debloat}
          onChange={(e) => setDebloat(e.target.checked)}
        />
      </label>
      <button type="submit">Update Package</button>
    </form>
  );
};

export default UpdatePackage;
