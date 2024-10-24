import React, { useState } from 'react';
import { recommendPackages } from '../services/api';

const RecommendationForm: React.FC = () => {
  const [description, setDescription] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const handleRecommend = async (event: React.FormEvent) => {
    event.preventDefault();
    const recommendedPackages = await recommendPackages(description);
    setRecommendations(recommendedPackages);
  };

  return (
    <div>
      <form onSubmit={handleRecommend}>
        <input
          type="text"
          placeholder="Describe your needs"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Get Recommendations</button>
      </form>
      <div>
        <h3>Recommended Packages</h3>
        <ul>
          {recommendations.map((pkg, index) => (
            <li key={index}>{pkg.Name} (Score: {pkg.Score})</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RecommendationForm;