import React from 'react'; 
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; 
import PackageVersion from '../components/PackageVersion'; 
import '@testing-library/jest-dom';  

// Mock the global alert and console.error to prevent actual alerts and error logging during testing
const mockAlert = jest.fn();
const mockConsoleError = jest.fn();
global.alert = mockAlert;
global.console = { 
  ...global.console, 
  error: mockConsoleError 
};

jest.mock('../services/api', () => ({   
  fetchPackageVersion: jest.fn()
}));  

beforeEach(() => {
  mockAlert.mockClear();
  mockConsoleError.mockClear();
});

test('renders search form', () => {   
  render(<PackageVersion />);      
  expect(screen.getByPlaceholderText(/Package Name/i)).toBeInTheDocument();   
  expect(screen.getByPlaceholderText(/Version/i)).toBeInTheDocument();
  expect(screen.getByText(/Fetch/i)).toBeInTheDocument(); 
});  

test('allows typing package name and version', () => {   
  render(<PackageVersion />);      
  const packageNameInput = screen.getByPlaceholderText(/Package Name/i);   
  const versionInput = screen.getByPlaceholderText(/Version/i);
  
  fireEvent.change(packageNameInput, { target: { value: 'react' } });   
  fireEvent.change(versionInput, { target: { value: '17.0.0' } });   
  
  expect(packageNameInput).toHaveValue('react');
  expect(versionInput).toHaveValue('17.0.0'); 
});  

test('handles successful package version fetch', async () => {   
  render(<PackageVersion />);   
  const fetchPackageVersion = require('../services/api').fetchPackageVersion;
  
  // Mock successful API response
  const mockPackages = [
    { Name: 'react', Version: '17.0.0', ID: 'react-17' },
    { Name: 'react-dom', Version: '17.0.0', ID: 'react-dom-17' }
  ];
  fetchPackageVersion.mockResolvedValue(mockPackages);

  // Trigger search   
  const packageNameInput = screen.getByPlaceholderText(/Package Name/i);   
  const versionInput = screen.getByPlaceholderText(/Version/i);
  const fetchButton = screen.getByText(/Fetch/i);
  
  fireEvent.change(packageNameInput, { target: { value: 'react' } });   
  fireEvent.change(versionInput, { target: { value: '17.0.0' } });   
  fireEvent.click(fetchButton);    

  // Wait for results
  await waitFor(() => {
    expect(mockAlert).toHaveBeenCalledWith('Package version(s) fetched successfully!');
    
    // Use queryAllByText to handle multiple occurrences
    const reactElements = screen.queryAllByText('react');
    const versionElements = screen.queryAllByText('17.0.0');
    
    expect(reactElements.length).toBeGreaterThan(0);
    expect(versionElements.length).toBeGreaterThan(0);
  });
});

test('handles error scenario when fetching package version fails', async () => {   
  render(<PackageVersion />);   
  const fetchPackageVersion = require('../services/api').fetchPackageVersion;
  
  // Mock the API to throw an error
  fetchPackageVersion.mockRejectedValue(new Error('Network error'));

  // Trigger search   
  const packageNameInput = screen.getByPlaceholderText(/Package Name/i);   
  const versionInput = screen.getByPlaceholderText(/Version/i);
  const fetchButton = screen.getByText(/Fetch/i);
  
  fireEvent.change(packageNameInput, { target: { value: 'react' } });   
  fireEvent.change(versionInput, { target: { value: '17.0.0' } });   
  fireEvent.click(fetchButton);    

  // Wait for error handling
  await waitFor(() => {
    // Check that the error alert was called
    expect(mockAlert).toHaveBeenCalledWith('Failed to fetch package version');
    
    // Ensure search results are not displayed
    expect(screen.queryByText(/Package Version Results:/i)).toBeNull();

    // Verify console.error was called
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error fetching package version:', 
      expect.any(Error)
    );
  });
});

test('handles no results scenario', async () => {   
  render(<PackageVersion />);   
  const fetchPackageVersion = require('../services/api').fetchPackageVersion;
  
  // Mock empty API response
  fetchPackageVersion.mockResolvedValue([]);

  // Trigger search   
  const packageNameInput = screen.getByPlaceholderText(/Package Name/i);   
  const versionInput = screen.getByPlaceholderText(/Version/i);
  const fetchButton = screen.getByText(/Fetch/i);
  
  fireEvent.change(packageNameInput, { target: { value: 'nonexistent-package' } });   
  fireEvent.change(versionInput, { target: { value: '1.0.0' } });   
  fireEvent.click(fetchButton);    

  // Wait for results
  await waitFor(() => {
    expect(mockAlert).toHaveBeenCalledWith('No package versions found.');
    expect(screen.queryByText(/Package Version Results:/i)).toBeNull();
  });
});

test('paginates search results and handles previous page navigation', async () => {   
  render(<PackageVersion />);   
  const fetchPackageVersion = require('../services/api').fetchPackageVersion;
  
  // Create 10 mock packages
  const mockPackages = new Array(10).fill(null).map((_, i) => ({ 
    Name: `Package ${i+1}`, 
    Version: '1.0.0', 
    ID: `${i}` 
  }));
  fetchPackageVersion.mockResolvedValue(mockPackages);    

  // Trigger search   
  const packageNameInput = screen.getByPlaceholderText(/Package Name/i);   
  const versionInput = screen.getByPlaceholderText(/Version/i);
  const fetchButton = screen.getByText(/Fetch/i);
  
  fireEvent.change(packageNameInput, { target: { value: 'test' } });   
  fireEvent.change(versionInput, { target: { value: '1.0.0' } });   
  fireEvent.click(fetchButton);    

  // Wait for initial results (first page)
  await waitFor(() => {
    expect(screen.getByText('Package 1')).toBeInTheDocument();
    expect(screen.getByText('Package 4')).toBeInTheDocument();
    expect(screen.queryByText('Package 5')).toBeNull();
  });

  // Go to the next page   
  fireEvent.click(screen.getByText(/Next/i));   
  
  await waitFor(() => {
    expect(screen.getByText('Package 5')).toBeInTheDocument();
    expect(screen.queryByText('Package 1')).toBeNull();
  });

  // Go back to the previous page
  fireEvent.click(screen.getByText(/Previous/i));
  
  await waitFor(() => {
    expect(screen.getByText('Package 1')).toBeInTheDocument();
    expect(screen.getByText('Package 4')).toBeInTheDocument();
    expect(screen.queryByText('Package 5')).toBeNull();
  });
});