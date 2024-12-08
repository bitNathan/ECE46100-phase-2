import React from 'react';
import { render, screen, act } from '@testing-library/react';
import PackageList from '../components/PackageList';
import '@testing-library/jest-dom';

jest.mock('../services/api', () => ({
  getPackages: jest.fn().mockResolvedValue([
    { Version: '1.0.0', Name: 'test-package', ID: '123' },
  ]),
}));

test('renders and shows loading', async () => {
  await act(async () => {
    render(<PackageList />);
  });

  expect(screen.getByText(/Available Packages/i)).toBeInTheDocument();
  expect(screen.getByText(/10 Packages per page/i)).toBeInTheDocument();
});

test('displays fetched packages', async () => {
  await act(async () => {
    render(<PackageList />);
  });

  expect(screen.getByText('test-package')).toBeInTheDocument();
  expect(screen.getByText('123')).toBeInTheDocument();
});
