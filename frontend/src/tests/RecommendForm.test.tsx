import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RecommendForm from '../components/RecommendForm';
import '@testing-library/jest-dom';

jest.mock('../services/api', () => ({
  recommendPackages: jest.fn().mockResolvedValue({ data: { recommendations: "test-recommendation" } })
}));

test('renders recommendations form', () => {
  render(<RecommendForm />);

  expect(screen.getByPlaceholderText(/Describe your project/i)).toBeInTheDocument();
  expect(screen.getByText(/Recommend Packages/i)).toBeInTheDocument();
});

test('handles input and button click', async () => {
  render(<RecommendForm />);
  
  const textarea = screen.getByPlaceholderText(/Describe your project/i);
  fireEvent.change(textarea, { target: { value: 'A new React app' } });
  
  expect(textarea).toHaveValue('A new React app');
});
