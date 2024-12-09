import React, { useState } from 'react';
import { recommendPackages } from '../services/api';

const RecommendForm: React.FC = () => {
  const [description, setDescription] = useState('');
  const [recommendations, setRecommendations] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleRecommend = async () => {
    setLoading(true);
    try {
      const data = await recommendPackages(description);
      setRecommendations(data.data.recommendations || 'No recommendations found.');
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations('An error occurred while fetching recommendations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Get Package Recommendations</h2>
      <textarea
        placeholder="Describe your project..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ width: '300px', height: '100px' }}
      />
      <br />
      <button onClick={handleRecommend} disabled={loading || !description.trim()}>
        {loading ? 'Loading...' : 'Recommend Packages'}
      </button>

      {recommendations && (
        <div style={{ marginTop: '20px' }}>
          <h3>Recommended Packages:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f9f9f9', padding: '10px', borderRadius: '4px' }}>
            {recommendations}
          </pre>
        </div>
      )}
    </div>
  );
};

export default RecommendForm;
