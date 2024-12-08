import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PackageVersion from '../components/PackageVersion';
import '@testing-library/jest-dom';

jest.mock('../services/api', () => ({
  fetchPackageVersion: jest.fn(),
}));

test('renders form for fetching package version', () => {
  render(<PackageVersion />);
  
  expect(screen.getByPlaceholderText(/Package Name/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Version/i)).toBeInTheDocument();
});

test('inputs can be typed into', () => {
  render(<PackageVersion />);
  
  const nameInput = screen.getByPlaceholderText(/Package Name/i);
  const versionInput = screen.getByPlaceholderText(/Version/i);

  fireEvent.change(nameInput, { target: { value: 'my-package' } });
  fireEvent.change(versionInput, { target: { value: '2.0.0' } });

  expect(nameInput).toHaveValue('my-package');
  expect(versionInput).toHaveValue('2.0.0');
});
