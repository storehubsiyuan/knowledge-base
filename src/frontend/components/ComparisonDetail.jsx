import React, { useState, useEffect, useRef } from 'react';

function ComparisonDetail({ comparison }) {
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    const fetchComparisonContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real app, this would be an API call
        // For now, we'll simulate loading the HTML file
        const response = await fetch(`/output/${comparison.fileName}`);
        
        if (!response.ok) {
          throw new Error(`File does not exist or cannot be accessed (${response.status})`);
        }
        
        const html = await response.text();
        
        setHtmlContent(html);
        setLoading(false);
      } catch (error) {
        console.error('Error loading comparison content:', error);
        setError(error.message || 'Error loading comparison content');
        setLoading(false);
      }
    };

    if (comparison) {
      fetchComparisonContent();
    }
  }, [comparison]);

  // Effect to update iframe content when htmlContent changes
  useEffect(() => {
    if (!loading && !error && iframeRef.current && htmlContent) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      
      // Extract valid HTML content
      const validHtml = extractValidHtmlContent(htmlContent);
      
      // Write the valid HTML to the iframe
      doc.open();
      doc.write(validHtml);
      doc.close();
      
      // Function to resize iframe based on content height
      const resizeIframe = () => {
        if (iframe.contentWindow.document.body) {
          // Add some padding to avoid scrollbars
          const height = iframe.contentWindow.document.body.scrollHeight + 30;
          iframe.style.height = height + 'px';
        }
      };
      
      // Try to resize on load and after a delay for images etc.
      iframe.onload = resizeIframe;
      setTimeout(resizeIframe, 100);
      setTimeout(resizeIframe, 500); // Another attempt for slow-loading content
      
      // Add resize observer to the iframe content if supported
      if (typeof ResizeObserver !== 'undefined') {
        try {
          const ro = new ResizeObserver(() => {
            resizeIframe();
          });
          
          if (iframe.contentWindow.document.body) {
            ro.observe(iframe.contentWindow.document.body);
          }
        } catch (e) {
          console.warn('ResizeObserver not supported or error:', e);
        }
      }
      
      // Add a window resize listener to handle responsiveness
      const handleResize = () => {
        resizeIframe();
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [htmlContent, loading, error]);

  // Function to open comparison in a new tab
  const openInNewTab = () => {
    // Create a blob with the HTML content
    const validHtml = extractValidHtmlContent(htmlContent);
    const blob = new Blob([validHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Open the blob URL in a new tab
    window.open(url, '_blank');
    
    // Clean up the URL object after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  // Function to extract just the valid HTML content
  const extractValidHtmlContent = (html) => {
    // First try to extract only the content between <body> and </body>
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    
    if (bodyMatch && bodyMatch[1]) {
      const bodyContent = bodyMatch[1];
      
      // Get any CSS from the original document
      const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
      const styles = styleMatches ? styleMatches.join('\n') : '';
      
      // Create a new HTML document with just the body content and styles
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${comparison.title} - Comparison</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.8;
                color: #333;
                margin: 0;
                padding: 20px;
                max-width: 1200px;
                margin: 0 auto;
              }
              p {
                margin: 0 0 16px 0;
              }
              ul, ol {
                margin-bottom: 16px;
                padding-left: 20px;
              }
              li {
                margin-bottom: 8px;
              }
              h1, h2, h3, h4, h5, h6 {
                margin-top: 24px;
                margin-bottom: 16px;
              }
              .highlight, [style*="background-color: #FFFF99"] {
                background-color: #FFFF99 !important;
                padding: 2px 0;
              }
              blockquote, .important, .note {
                padding: 15px;
                margin: 16px 0;
                border-left: 4px solid #ddd;
                background-color: #f9f9f9;
              }
              .important {
                border-left-color: #ff6b6b;
                background-color: #fff3f3;
              }
              strong, b {
                font-weight: 600;
              }
              code, pre {
                font-family: monospace;
                background-color: #f5f5f5;
                padding: 2px 4px;
                border-radius: 3px;
              }
              pre {
                padding: 16px;
                overflow: auto;
                line-height: 1.45;
                margin-bottom: 16px;
              }
              table {
                border-collapse: collapse;
                width: 100%;
                margin-bottom: 16px;
              }
              th, td {
                padding: 8px;
                border: 1px solid #ddd;
                text-align: left;
              }
              th {
                background-color: #f2f2f2;
              }
              ${styles ? '/* Original styles */\n' + styles : ''}
            </style>
          </head>
          <body>
            <h1>${comparison.title} - Comparison</h1>
            <p><a href="${comparison.sourceUrl}" target="_blank">View Original Article</a></p>
            <hr>
            ${bodyContent}
          </body>
        </html>
      `;
    }
    
    // If we couldn't extract the body, try to extract the full HTML document
    const docTypeMatch = html.match(/<!DOCTYPE[^>]*>/i);
    const htmlCloseMatch = html.match(/<\/html>\s*$/i);
    
    if (docTypeMatch && htmlCloseMatch) {
      const startIndex = docTypeMatch.index;
      const endIndex = htmlCloseMatch.index + '</html>'.length;
      
      // Return only the valid HTML document
      return html.substring(startIndex, endIndex);
    }
    
    // As a last resort, wrap the content in basic HTML
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${comparison.title} - Comparison</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.8;
              color: #333;
              margin: 0;
              padding: 20px;
              max-width: 1200px;
              margin: 0 auto;
            }
            p {
              margin: 0 0 16px 0;
            }
            ul, ol {
              margin-bottom: 16px;
              padding-left: 20px;
            }
            li {
              margin-bottom: 8px;
            }
            h1, h2, h3, h4, h5, h6 {
              margin-top: 24px;
              margin-bottom: 16px;
            }
            .highlight, [style*="background-color: #FFFF99"] {
              background-color: #FFFF99 !important;
              padding: 2px 0;
            }
            blockquote, .important, .note {
              padding: 15px;
              margin: 16px 0;
              border-left: 4px solid #ddd;
              background-color: #f9f9f9;
            }
            .important {
              border-left-color: #ff6b6b;
              background-color: #fff3f3;
            }
          </style>
        </head>
        <body>
          <h1>${comparison.title} - Comparison</h1>
          <p><a href="${comparison.sourceUrl}" target="_blank">View Original Article</a></p>
          <hr>
          ${html}
        </body>
      </html>
    `;
  };

  return (
    <div className="comparison-detail">
      <div className="comparison-header">
        <h2>{comparison.title}</h2>
        <div className="comparison-actions">
          <a 
            href={comparison.sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="source-link"
          >
            View Original
          </a>
          {!loading && !error && (
            <button 
              className="fullscreen-button"
              onClick={openInNewTab}
            >
              Open in New Page
            </button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading comparison content...</div>
      ) : error ? (
        <div className="error-message">
          <h3>Error Loading Comparison</h3>
          <p>{error}</p>
          <div className="error-help">
            <p>Please make sure you've run the comparison tool to generate the comparison file:</p>
            <pre>npm run compare-article</pre>
            <p>This command will generate an HTML comparison file and save it to the output directory.</p>
          </div>
        </div>
      ) : (
        <div className="comparison-content">
          <iframe 
            ref={iframeRef}
            className="comparison-iframe"
            title="Comparison Content"
            sandbox="allow-same-origin"
            frameBorder="0"
          />
        </div>
      )}
    </div>
  );
}

export default ComparisonDetail; 