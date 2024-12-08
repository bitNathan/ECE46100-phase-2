import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DownloadPackage from '../components/DownloadPackage';
import '@testing-library/jest-dom';
import * as api from '../services/api';

// Mock the API module to control its behavior for testing
jest.mock('../services/api', () => ({
  downloadPackage: jest.fn(),
  downloadPackageByNameVersion: jest.fn(),
}));

function setup() {
  const utils = render(<DownloadPackage />);
  const nameInput = screen.getByPlaceholderText(/Package Name/i);
  const versionInput = screen.getByPlaceholderText(/Package Version/i);
  const idInput = screen.getByPlaceholderText(/Package ID/i);
  const [downloadByNameVersionButton, downloadByIdButton] = screen.getAllByText(/Download Package/i);
  return {
    ...utils,
    nameInput,
    versionInput,
    idInput,
    downloadByNameVersionButton,
    downloadByIdButton
  };
}

test('renders download forms', () => {
  setup();
  expect(screen.getByText(/Download by Name and Version/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Package Name/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Package Version/i)).toBeInTheDocument();
  expect(screen.getByText(/Download by Package ID/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Package ID/i)).toBeInTheDocument();
});

test('allows typing in text fields for name/version', () => {
  const { nameInput, versionInput } = setup();

  fireEvent.change(nameInput, { target: { value: 'test-pkg' } });
  fireEvent.change(versionInput, { target: { value: '1.0.0' } });

  expect(nameInput).toHaveValue('test-pkg');
  expect(versionInput).toHaveValue('1.0.0');
});

test('triggers download by ID when form submitted', async () => {
  const { idInput, downloadByIdButton } = setup();
  (api.downloadPackage as jest.Mock).mockResolvedValue({ data: { Content: btoa('file content') }, metadata: { Name: 'pkg', Version: '1.0.0', ID: '123' } });

  fireEvent.change(idInput, { target: { value: '123' } });
  fireEvent.click(downloadByIdButton);

  await waitFor(() => {
    expect(api.downloadPackage).toHaveBeenCalledWith('123');
  });
});

test('displays error alert if the download by ID fails', async () => {
  global.alert = jest.fn();  // Mocking global alert function
  const { idInput, downloadByIdButton } = setup();
  (api.downloadPackage as jest.Mock).mockRejectedValue(new Error('Failed to download'));

  fireEvent.change(idInput, { target: { value: '123' } });
  fireEvent.click(downloadByIdButton);

  await waitFor(() => {
    expect(global.alert).toHaveBeenCalledWith('Package Not Found or Error Occurred.'); // Customizing the error message
  });
});
