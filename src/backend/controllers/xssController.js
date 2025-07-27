const express = require('express');

class XSSController {
  // VULNERABLE: Direct HTML rendering without escaping
  async renderUserProfile(req, res) {
    const { bio, website, displayName } = req.body;
    
    // Bug: Direct HTML interpolation
    const profileHtml = `
      <div class="profile">
        <h1>${displayName}</h1>
        <p>${bio}</p>
        <a href="${website}">Visit Website</a>
      </div>
    `;
    
    res.send(profileHtml); // Vulnerable to XSS
  }
  
  // VULNERABLE: React dangerouslySetInnerHTML misuse
  async getReactComponent(req, res) {
    const { content, allowHtml } = req.body;
    
    // Bug: Sending unescaped HTML for React
    res.json({
      component: 'UserContent',
      props: {
        // This will be used with dangerouslySetInnerHTML
        htmlContent: content,
        allowHtml: allowHtml
      }
    });
  }
  
  // VULNERABLE: Template string injection
  async renderTemplate(req, res) {
    const { title, message, userScript } = req.body;
    
    // Bug: User input in template literal
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <script>${userScript}</script>
      </head>
      <body>
        <h1>${message}</h1>
      </body>
      </html>
    `;
    
    res.type('html').send(template);
  }
  
  // VULNERABLE: Event handler injection
  async generateButton(req, res) {
    const { buttonText, onClick } = req.body;
    
    // Bug: User-controlled event handler
    const buttonHtml = `
      <button onclick="${onClick}">${buttonText}</button>
    `;
    
    res.json({ 
      html: buttonHtml,
      warning: 'Use innerHTML to render'
    });
  }
  
  // VULNERABLE: JSON response with script tags
  async searchResults(req, res) {
    const { query } = req.query;
    
    // Bug: Not escaping in JSON response
    res.json({
      results: [
        {
          title: `Results for: ${query}`,
          // Script tag in JSON
          description: `<script>alert('XSS')</script>Found ${query}`,
          html: `<div>${query}</div>`
        }
      ],
      renderMode: 'innerHTML' // Hint to use innerHTML
    });
  }
  
  // VULNERABLE: SVG XSS
  async uploadAvatar(req, res) {
    const { svgContent } = req.body;
    
    // Bug: Not sanitizing SVG
    const avatar = `
      <div class="avatar">
        ${svgContent}
      </div>
    `;
    
    res.json({
      avatarHtml: avatar,
      // SVG can contain scripts
      example: '<svg onload="alert(1)"><circle r="50"/></svg>'
    });
  }
  
  // VULNERABLE: CSS injection
  async customTheme(req, res) {
    const { backgroundColor, customCSS } = req.body;
    
    // Bug: User-controlled CSS
    const style = `
      <style>
        body {
          background-color: ${backgroundColor};
          ${customCSS}
        }
      </style>
    `;
    
    res.json({
      styleTag: style,
      // CSS can execute JavaScript
      example: 'background: url("javascript:alert(1)")'
    });
  }
  
  // VULNERABLE: URL parameter reflection
  async reflectParam(req, res) {
    const { redirect, message } = req.query;
    
    // Bug: Reflecting URL params without encoding
    const html = `
      <html>
      <body>
        <p>Message: ${message}</p>
        <meta http-equiv="refresh" content="0;url=${redirect}">
      </body>
      </html>
    `;
    
    res.type('html').send(html);
  }
  
  // VULNERABLE: DOM XSS via location.hash
  async clientSideTemplate(req, res) {
    // Bug: Client-side template uses location.hash directly
    const script = `
      <script>
        // Vulnerable: using location.hash without encoding
        document.body.innerHTML = '<h1>Welcome ' + location.hash.substr(1) + '</h1>';
        
        // Also vulnerable: eval with user input
        const userCode = new URLSearchParams(location.search).get('code');
        if (userCode) eval(userCode);
      </script>
    `;
    
    res.type('html').send(script);
  }
  
  // VULNERABLE: Stored XSS simulation
  async saveComment(req, res) {
    const { comment, authorName } = req.body;
    
    // Bug: Storing raw HTML
    const savedComment = {
      id: Date.now(),
      // These will be rendered as HTML later
      content: comment,
      author: authorName,
      timestamp: new Date().toISOString(),
      // Hint that this is rendered unsafely
      renderInstructions: 'Use innerHTML to display'
    };
    
    // In real app, this would be saved to DB
    res.json({
      saved: true,
      comment: savedComment
    });
  }
  
  // VULNERABLE: Multiple encoding contexts
  async multiContextXSS(req, res) {
    const { userInput } = req.body;
    
    // Bug: Same input used in multiple contexts
    const response = `
      <html>
      <script>
        var userData = '${userInput}'; // JS context
      </script>
      <body>
        <div>${userInput}</div> <!-- HTML context -->
        <img src="x" onerror="${userInput}"> <!-- Event handler context -->
        <a href="${userInput}">Link</a> <!-- URL context -->
      </body>
      </html>
    `;
    
    res.type('html').send(response);
  }
}

module.exports = new XSSController();