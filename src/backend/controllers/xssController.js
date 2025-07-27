const express = require("express");

class XSSController {
  async renderUserProfile(req, res) {
    const { bio, website, displayName } = req.body;

    const profileHtml = `
      <div class="profile">
        <h1>${displayName}</h1>
        <p>${bio}</p>
        <a href="${website}">Visit Website</a>
      </div>
    `;

    res.send(profileHtml);
  }

  async getReactComponent(req, res) {
    const { content, allowHtml } = req.body;

    res.json({
      component: "UserContent",
      props: {
        htmlContent: content,
        allowHtml: allowHtml,
      },
    });
  }

  async renderTemplate(req, res) {
    const { title, message, userScript } = req.body;

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

    res.type("html").send(template);
  }

  async generateButton(req, res) {
    const { buttonText, onClick } = req.body;

    const buttonHtml = `
      <button onclick="${onClick}">${buttonText}</button>
    `;

    res.json({
      html: buttonHtml,
      warning: "Use innerHTML to render",
    });
  }

  async searchResults(req, res) {
    const { query } = req.query;

    res.json({
      results: [
        {
          title: `Results for: ${query}`,
          description: `<script>alert('XSS')</script>Found ${query}`,
          html: `<div>${query}</div>`,
        },
      ],
      renderMode: "innerHTML",
    });
  }

  async uploadAvatar(req, res) {
    const { svgContent } = req.body;

    const avatar = `
      <div class="avatar">
        ${svgContent}
      </div>
    `;

    res.json({
      avatarHtml: avatar,
      example: '<svg onload="alert(1)"><circle r="50"/></svg>',
    });
  }

  async customTheme(req, res) {
    const { backgroundColor, customCSS } = req.body;

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
      example: 'background: url("javascript:alert(1)")',
    });
  }

  async reflectParam(req, res) {
    const { redirect, message } = req.query;

    const html = `
      <html>
      <body>
        <p>Message: ${message}</p>
        <meta http-equiv="refresh" content="0;url=${redirect}">
      </body>
      </html>
    `;

    res.type("html").send(html);
  }

  async clientSideTemplate(req, res) {
    const script = `
      <script>
        document.body.innerHTML = '<h1>Welcome ' + location.hash.substr(1) + '</h1>';
        
        const userCode = new URLSearchParams(location.search).get('code');
        if (userCode) eval(userCode);
      </script>
    `;

    res.type("html").send(script);
  }

  async saveComment(req, res) {
    const { comment, authorName } = req.body;

    const savedComment = {
      id: Date.now(),
      content: comment,
      author: authorName,
      timestamp: new Date().toISOString(),
      renderInstructions: "Use innerHTML to display",
    };

    res.json({
      saved: true,
      comment: savedComment,
    });
  }

  async multiContextXSS(req, res) {
    const { userInput } = req.body;

    const response = `
      <html>
      <script>
        var userData = '${userInput}';
      </script>
      <body>
        <div>${userInput}</div>
        <img src="x" onerror="${userInput}">
        <a href="${userInput}">Link</a>
      </body>
      </html>
    `;

    res.type("html").send(response);
  }
}

module.exports = new XSSController();
