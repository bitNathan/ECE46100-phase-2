import React, { useEffect, useState } from 'react';
import { getPlannedTracks } from '../services/api';

const TracksList: React.FC = () => {
  const [tracks, setTracks] = useState<string[]>([]);

  useEffect(() => {
    const fetchTracks = async () => {
      const tracksData = await getPlannedTracks();
      setTracks(tracksData);
    };
    fetchTracks();
  }, []);

  return (
    <div>
      <h3>Planned Tracks</h3>
      <ul>
        {tracks.map((track, index) => (
          <li key={index}>{track}</li>
        ))}
      </ul>
    </div>
  );
};

export default TracksList;