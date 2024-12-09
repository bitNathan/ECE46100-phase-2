import { Router } from 'express';

const tracksRouter = Router();

// Define the available tracks
const availableTracks = [
  'ML inside track'
];

// GET /tracks - Returns the list of planned tracks
tracksRouter.get('/tracks', (req, res) => {
  try {
    res.status(200).json({ plannedTracks: availableTracks });
  } catch (error) {
    console.error('Error retrieving tracks:', error);
    res.status(500).json({ message: 'The system encountered an error while retrieving the student\'s track information.' });
  }
});

export default tracksRouter;
