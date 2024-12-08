import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';
import '@testing-library/jest-dom';

test('renders the app title', () => {
  render(<App />);
  const headingElement = screen.getByText(/Trustworthy Module Registry/i);
  expect(headingElement).toBeInTheDocument();
});
