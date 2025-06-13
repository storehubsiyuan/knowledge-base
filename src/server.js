const express = require('express');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the React app from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// API endpoint to get list of comparisons
app.get('/api/comparisons', (req, res) => {
  const comparisons = [
    {
      id: 1,
      title: 'BackOffice: How to Set Up Tax Codes',
      createdAt: new Date().toISOString(),
      sourceUrl: 'https://care.storehub.com/en/articles/5726893-backoffice-how-to-set-up-tax-codes',
      fileName: 'tax_code_comparison.html'
    }
  ];
  
  res.json(comparisons);
});

// Serve the generated HTML files from the output directory
app.use('/output', express.static(path.join(__dirname, '../output')));

// Handle all other routes by serving the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 