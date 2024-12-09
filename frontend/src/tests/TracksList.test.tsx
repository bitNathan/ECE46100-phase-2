import React from 'react';
import { render, screen, act } from '@testing-library/react';
import TracksList from '../components/TracksList';
import '@testing-library/jest-dom';

jest.mock('../services/api', () => ({
  getPlannedTracks: jest.fn().mockResolvedValue(['Track1', 'Track2']),
}));

test('renders tracks', async () => {
  await act(async () => {
    render(<TracksList />);
  });

  expect(screen.getByText(/Planned Tracks/i)).toBeInTheDocument();
  expect(screen.getByText('Track1')).toBeInTheDocument();
  expect(screen.getByText('Track2')).toBeInTheDocument();
});
