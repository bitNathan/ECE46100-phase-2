import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DownloadPackage from '../components/DownloadPackage';
import '@testing-library/jest-dom';

jest.mock('../services/api', () => ({
  downloadPackage: jest.fn(),
  downloadPackageByNameVersion: jest.fn(),
}));

test('renders download forms', () => {
  render(<DownloadPackage />);

  expect(screen.getByText(/Download by Name and Version/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Package Name/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Package Version/i)).toBeInTheDocument();

  expect(screen.getByText(/Download by Package ID/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Package ID/i)).toBeInTheDocument();
});

test('allows typing in text fields for name/version', () => {
  render(<DownloadPackage />);
  
  const nameInput = screen.getByPlaceholderText(/Package Name/i);
  const versionInput = screen.getByPlaceholderText(/Package Version/i);

  fireEvent.change(nameInput, { target: { value: 'test-pkg' } });
  fireEvent.change(versionInput, { target: { value: '1.0.0' } });

  expect(nameInput).toHaveValue('test-pkg');
  expect(versionInput).toHaveValue('1.0.0');
});
