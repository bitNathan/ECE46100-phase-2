import React, { useState } from 'react';
import { auditPackageConfusion } from '../services/api';

const AuditConfusion: React.FC = () => {
  const [confusionResults, setConfusionResults] = useState<any[]>([]);

  const handleAudit = async () => {
    const results = await auditPackageConfusion();
    setConfusionResults(results);
  };

  return (
    <div>
      <button onClick={handleAudit}>Audit Package Confusion</button>
      <div>
        <h3>Package Confusion Audit Results</h3>
        <ul>
          {confusionResults.map((pkg, index) => (
            <li key={index}>{pkg.Name} - {pkg.Reason}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AuditConfusion;