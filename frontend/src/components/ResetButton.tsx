import React from 'react';
import { resetRegistry } from '../services/api';

const ResetButton: React.FC = () => {
  const handleReset = async () => {
    await resetRegistry();
  };

  return (
    <button onClick={handleReset}>Reset Registry</button>
  );
};

export default ResetButton;