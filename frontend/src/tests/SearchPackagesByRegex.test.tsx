import React from 'react'; 
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; 
import SearchPackagesByRegex from '../components/SearchPackagesByRegex'; 
import '@testing-library/jest-dom';  

// Mock the global alert to prevent actual alerts during testing

const mockAlert = jest.fn();
const mockConsoleError = jest.fn();
global.alert = mockAlert;
global.console = { 
  ...global.console, 
  error: mockConsoleError 
};

jest.mock('../services/api', () => ({   
  getPackagesByRegEx: jest.fn()
}));  

beforeEach(() => {
  mockAlert.mockClear();
  mockConsoleError.mockClear();
});

test('renders search form', () => {   
  render(<SearchPackagesByRegex />);      
  expect(screen.getByPlaceholderText(/Enter Regex/i)).toBeInTheDocument();   
  expect(screen.getByText(/Search Packages/i)).toBeInTheDocument(); 
});  

test('allows typing regex', () => {   
  render(<SearchPackagesByRegex />);      
  const input = screen.getByPlaceholderText(/Enter Regex/i);   
  fireEvent.change(input, { target: { value: '.*test.*' } });   
  expect(input).toHaveValue('.*test.*'); 
});  

test('handles error scenario when fetching packages fails', async () => {   
  render(<SearchPackagesByRegex />);   
  const getPackagesByRegEx = require('../services/api').getPackagesByRegEx;
  
  // Mock the API to throw an error
  getPackagesByRegEx.mockRejectedValue(new Error('Network error'));

  // Trigger search   
  const input = screen.getByPlaceholderText(/Enter Regex/i);   
  fireEvent.change(input, { target: { value: '.*test.*' } });   
  fireEvent.click(screen.getByText(/Search Packages/i));    

  // Wait for error handling
  await waitFor(() => {
    // Check that the error alert was called
    expect(mockAlert).toHaveBeenCalledWith('Failed to fetch packages');
    
    // Ensure search results are cleared
    expect(screen.queryByText(/Package Metadata:/i)).toBeNull();

    // Verify console.error was called
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error fetching package:', 
      expect.any(Error)
    );
  });
});

test('paginates search results and handles previous page navigation', async () => {   
  render(<SearchPackagesByRegex />);   
  const getPackagesByRegEx = require('../services/api').getPackagesByRegEx;
  
  // Create 10 mock packages
  getPackagesByRegEx.mockResolvedValue(new Array(10).fill(null).map((_, i) => ({ 
    Name: `Package ${i+1}`, 
    Version: '1.0.0', 
    ID: `${i}` 
  })));    

  // Trigger search   
  const input = screen.getByPlaceholderText(/Enter Regex/i);   
  fireEvent.change(input, { target: { value: '.*' } });   
  fireEvent.click(screen.getByText(/Search Packages/i));    

  // Wait for initial results (first page)
  await waitFor(() => {
    expect(screen.getByText('Package 1')).toBeInTheDocument();
    expect(screen.getByText('Package 3')).toBeInTheDocument();
    expect(screen.queryByText('Package 4')).toBeNull();
  });

  // Go to the next page   
  fireEvent.click(screen.getByText(/Next/i));   
  
  await waitFor(() => {
    expect(screen.getByText('Package 4')).toBeInTheDocument();
    expect(screen.queryByText('Package 1')).toBeNull();
  });

  // Go back to the previous page
  fireEvent.click(screen.getByText(/Previous/i));
  
  await waitFor(() => {
    expect(screen.getByText('Package 1')).toBeInTheDocument();
    expect(screen.getByText('Package 3')).toBeInTheDocument();
    expect(screen.queryByText('Package 4')).toBeNull();
  });
});