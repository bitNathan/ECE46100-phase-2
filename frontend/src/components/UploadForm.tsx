import React, { useState } from 'react';
import { uploadPackage } from '../services/api';

const UploadForm: React.FC = () => {
  const [packageName, setPackageName] = useState('');
  const [content, setContent] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [debloat, setDebloat] = useState(false);
  const [jsProgram, setJsProgram] = useState('');

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
    
    if (!content && !url) {
      alert('Please provide either a file or a URL.');
      return;
    }
    
    try {
      await uploadPackage(packageName, content, url, debloat, jsProgram);
    } catch (error) {
      // Error will be handled by uploadPackage function
      console.error('Submit error:', error);
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
      <button type="submit">Upload Package</button>
    </form>
  );
};

export default UploadForm;
