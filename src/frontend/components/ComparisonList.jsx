import React from 'react';

function ComparisonList({ comparisons, onSelect, selectedId }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="comparison-list">
      <h2>Knowledge Base Comparisons</h2>
      
      {comparisons.length === 0 ? (
        <p className="no-comparisons">No comparisons available</p>
      ) : (
        <ul>
          {comparisons.map(comparison => (
            <li 
              key={comparison.id} 
              className={`comparison-item ${selectedId === comparison.id ? 'selected' : ''}`}
              onClick={() => onSelect(comparison)}
            >
              <h3>{comparison.title}</h3>
              <div className="comparison-meta">
                <span className="date">Created: {formatDate(comparison.createdAt)}</span>
                <span className="source">
                  <a 
                    href={comparison.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Original
                  </a>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ComparisonList; 