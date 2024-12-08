import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import DownloadPackage from '../components/DownloadPackage';
import '@testing-library/jest-dom';
import * as api from '../services/api';

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

test('triggers download by ID when form submitted', async () => {
  const { downloadPackage } = require('../services/api');
  downloadPackage.mockResolvedValue({ data: { Content: btoa('file content') }, metadata: { Name: 'pkg', Version: '1.0.0', ID: '123' } });

  render(<DownloadPackage />);

  const idInput = screen.getByPlaceholderText(/Package ID/i);
  const submitButton = screen.getAllByText(/Download Package/i)[1]; // Assuming second button is for ID

  fireEvent.change(idInput, { target: { value: '123' } });
  fireEvent.click(submitButton);

  await waitFor(() => {
    expect(downloadPackage).toHaveBeenCalledWith('123');
  });
});

test('displays error alert if the download by ID fails', async () => {
  const { downloadPackage } = require('../services/api');
  global.alert = jest.fn();  // Mocking alert

  downloadPackage.mockRejectedValue(new Error('Failed to download'));

  render(<DownloadPackage />);
  
  const idInput = screen.getByPlaceholderText(/Package ID/i);
  fireEvent.change(idInput, { target: { value: '123' } });
  
  const submitButton = screen.getAllByText(/Download Package/i)[1];
  fireEvent.click(submitButton);

  await waitFor(() => {
    expect(global.alert).toHaveBeenCalledWith('Package Not Found or Error Occurred.'); // Assuming this is your error message
  });
});
