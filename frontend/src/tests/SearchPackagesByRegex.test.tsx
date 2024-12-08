import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchPackagesByRegex from '../components/SearchPackagesByRegex';
import '@testing-library/jest-dom';

jest.mock('../services/api', () => ({
  getPackagesByRegEx: jest.fn().mockResolvedValue([
    { Name: 'test-package', Version: '1.0.0', ID: 'abc' }
  ]),
}));

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
