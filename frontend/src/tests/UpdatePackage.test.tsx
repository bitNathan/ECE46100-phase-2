import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UpdatePackage from '../components/UpdatePackage';
import '@testing-library/jest-dom';

jest.mock('../services/api', () => ({
  updatePackage: jest.fn(),
}));

test('renders update form', () => {
  render(<UpdatePackage />);

  expect(screen.getByPlaceholderText(/Package ID/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Package Name/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/New Version/i)).toBeInTheDocument();
});

test('allows filling the update form', () => {
  render(<UpdatePackage />);
  
  const idInput = screen.getByPlaceholderText(/Package ID/i);
  const nameInput = screen.getByPlaceholderText(/Package Name/i);
  const versionInput = screen.getByPlaceholderText(/New Version/i);

  fireEvent.change(idInput, { target: { value: '123' } });
  fireEvent.change(nameInput, { target: { value: 'updated-package' } });
  fireEvent.change(versionInput, { target: { value: '1.0.1' } });

  expect(idInput).toHaveValue('123');
  expect(nameInput).toHaveValue('updated-package');
  expect(versionInput).toHaveValue('1.0.1');
});
