import React, { useState, useEffect } from 'react';
import ComparisonList from './components/ComparisonList';
import ComparisonDetail from './components/ComparisonDetail';

function App() {
  const [comparisons, setComparisons] = useState([]);
  const [selectedComparison, setSelectedComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the list of available comparisons
    const fetchComparisons = async () => {
      try {
        setLoading(true);
        
        // Try to fetch from the comparisons.json file
        const response = await fetch('/output/comparisons.json');
        
        if (response.ok) {
          const comparisonsData = await response.json();
          setComparisons(comparisonsData);
        } else {
          // Fallback to hardcoded comparisons if file doesn't exist
          setComparisons([
            {
              id: 1,
              type: 'taxCode',
              title: 'BackOffice: How to Set Up Tax Codes',
              createdAt: new Date().toISOString(),
              sourceUrl: 'https://care.storehub.com/en/articles/5726893-backoffice-how-to-set-up-tax-codes',
              fileName: 'tax_code_comparison.html'
            },
            {
              id: 2,
              type: 'stores',
              title: 'BackOffice: How to Add Store',
              createdAt: new Date().toISOString(),
              sourceUrl: 'https://care.storehub.com/en/articles/5726867-backoffice-how-to-add-store',
              fileName: 'stores_comparison.html'
            }
          ]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching comparisons:', error);
        
        // Fallback to hardcoded comparisons if fetch fails
        setComparisons([
          {
            id: 1,
            type: 'taxCode',
            title: 'BackOffice: How to Set Up Tax Codes',
            createdAt: new Date().toISOString(),
            sourceUrl: 'https://care.storehub.com/en/articles/5726893-backoffice-how-to-set-up-tax-codes',
            fileName: 'tax_code_comparison.html'
          },
          {
            id: 2,
            type: 'stores',
            title: 'BackOffice: How to Add Store',
            createdAt: new Date().toISOString(),
            sourceUrl: 'https://care.storehub.com/en/articles/5726867-backoffice-how-to-add-store',
            fileName: 'stores_comparison.html'
          }
        ]);
        setLoading(false);
      }
    };

    fetchComparisons();
  }, []);

  const handleComparisonSelect = (comparison) => {
    setSelectedComparison(comparison);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>StoreHub Knowledge Base Comparisons</h1>
        <p>Compare original articles with AI-enhanced knowledge base content</p>
      </header>
      
      <div className="app-content">
        {loading ? (
          <div className="loading">Loading comparisons...</div>
        ) : (
          <>
            <ComparisonList 
              comparisons={comparisons} 
              onSelect={handleComparisonSelect}
              selectedId={selectedComparison?.id}
            />
            
            {selectedComparison ? (
              <ComparisonDetail comparison={selectedComparison} />
            ) : (
              <div className="empty-state">
                <p>Select a comparison from the list to view details</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App; 