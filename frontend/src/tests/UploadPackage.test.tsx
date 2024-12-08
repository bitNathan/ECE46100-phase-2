import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UploadPackage from '../components/UploadPackage';
import '@testing-library/jest-dom';

jest.mock('../services/api', () => ({
  uploadPackage: jest.fn(),
}));

test('renders upload form', () => {
  render(<UploadPackage />);

  expect(screen.getByPlaceholderText(/Package Name/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Package URL/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/JSProgram/i)).toBeInTheDocument();
});

test('allows entering package details', () => {
  render(<UploadPackage />);
  
  const nameInput = screen.getByPlaceholderText(/Package Name/i);
  fireEvent.change(nameInput, { target: { value: 'my-new-package' } });
  expect(nameInput).toHaveValue('my-new-package');
});
