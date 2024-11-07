// This file contains API calls to interact with the backend.
import axios from 'axios';

// If using proxy, you can use a relative path
const API_BASE_URL = 'http://localhost:3000';
 // Use '/api' if proxy is configured

// If not using proxy, specify the full URL with the backend port
// const API_BASE_URL = 'http://localhost:3000';

export const getPackages = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/packages`);
    return response.data;
  } catch (error) {
    console.error('Error fetching packages:', error);
    return [];
  }
};

export const fetchPackageVersion = async (packageId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/package/${packageId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching package:', error);
    return null;
  }
}
export const uploadPackage = async (
  name: string,
  content: string | null,
  url: string | null,
  debloat: boolean,
  jsProgram: string
) => {
  try {
    const requestData: any = {
      Name: name,
      debloat: debloat,
      JSProgram: jsProgram,
    };

    if (content && !url) {
      requestData.Content = content;
    } else if (url && !content) {
      requestData.URL = url;
    } else {
      alert('Please provide either content or URL, but not both.');
      return;
    }

    await axios.post(`${API_BASE_URL}/package`, requestData);
    alert('Package uploaded successfully!');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.message || 'An unknown error occurred';

      alert(`Error: ${errorMessage} (Status Code: ${statusCode})`);

    } else {
      alert('Error: Failed to connect to the server.');
    }
  }
};


export const updatePackage = async (packageId: string, version: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append('version', version);
    formData.append('file', file);

    await axios.put(`${API_BASE_URL}/package/${packageId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (error) {
    console.error('Error updating package:', error);
  }
};

export const ratePackage = async (packageId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/package/${packageId}/rate`);
    return response.data;
  } catch (error) {
    console.error('Error rating package:', error);
    return null;
  }
};

export const downloadPackage = async (packageId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/package/${packageId}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${packageId}.zip`);
    document.body.appendChild(link);
    link.click();
  } catch (error) {
    console.error('Error downloading package:', error);
  }
};

export const recommendPackages = async (description: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/recommend`, { description });
    return response.data;
  } catch (error) {
    console.error('Error recommending packages:', error);
    return [];
  }
};

export const auditPackageConfusion = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/audit/confusion`);
    return response.data;
  } catch (error) {
    console.error('Error auditing package confusion:', error);
    return [];
  }
};

export const resetRegistry = async () => {
  try {
    await axios.post(`${API_BASE_URL}/reset`);
    alert('Registry has been reset successfully.');
  } catch (error) {
    console.error('Error resetting registry:', error);
  }
};

export const getPackageById = async (packageId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/package/${packageId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching package by ID:', error);
    return null;
  }
};

export const getPackageCost = async (packageId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/package/${packageId}/cost`);
    return response.data;
  } catch (error) {
    console.error('Error fetching package cost:', error);
    return null;
  }
};

export const getPackagesByRegEx = async (regex: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/package/byRegEx`, { params: { regex } });
    return response.data;
  } catch (error) {
    console.error('Error fetching packages by regex:', error);
    return [];
  }
};

export const getPlannedTracks = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/tracks`);
    return response.data;
  } catch (error) {
    console.error('Error fetching planned tracks:', error);
    return [];
  }
};