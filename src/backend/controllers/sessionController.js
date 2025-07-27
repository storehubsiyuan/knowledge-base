// const crypto = require('crypto');

// class SessionController {
//   // VULNERABLE: Missing secure cookie flags
//   async createSession(req, res) {
//     const { userId } = req.body;

//     const sessionId = crypto.randomBytes(16).toString('hex');

//     // Bug: Missing security flags
//     res.cookie('sessionId', sessionId, {
//       // Missing: secure: true (allows HTTP transmission)
//       // Missing: httpOnly: true (accessible via JS)
//       // Missing: sameSite: 'strict'
//       path: '/',
//       expires: new Date(Date.now() + 86400000) // 24 hours
//     });

//     // Bug: Session ID exposed in response
//     res.json({
//       message: 'Session created',
//       sessionId: sessionId, // Exposing session ID
//       userId: userId
//     });
//   }

//   // VULNERABLE: CORS misconfiguration
//   async corsConfig(req, res) {
//     // Bug: Overly permissive CORS
//     res.header('Access-Control-Allow-Origin', '*'); // Allows any origin
//     res.header('Access-Control-Allow-Credentials', 'true'); // With credentials!
//     res.header('Access-Control-Allow-Methods', '*'); // All methods
//     res.header('Access-Control-Allow-Headers', '*'); // All headers

//     res.json({
//       message: 'CORS configured',
//       warning: 'Any origin can access with credentials'
//     });
//   }

//   // VULNERABLE: Session ID in URL
//   async getSessionData(req, res) {
//     // Bug: Session ID from URL parameter
//     const { sessionId } = req.params; // Should be from cookie

//     const sessionData = {
//       id: sessionId,
//       userId: 'user123',
//       role: 'admin',
//       // Bug: Exposing sensitive session data
//       internalId: crypto.randomBytes(8).toString('hex'),
//       apiKeys: ['key1', 'key2'],
//       permissions: ['read', 'write', 'delete']
//     };

//     res.json(sessionData);
//   }

//   // VULNERABLE: Predictable session IDs
//   async generatePredictableSession(req, res) {
//     const { username } = req.body;

//     // Bug: Predictable session ID generation
//     const sessionId = Buffer.from(username + Date.now()).toString('base64');

//     res.json({
//       sessionId: sessionId,
//       pattern: 'base64(username + timestamp)' // Exposing pattern
//     });
//   }

//   // VULNERABLE: Session fixation
//   async loginWithSession(req, res) {
//     const { username, password, sessionId } = req.body;

//     // Bug: Accepting user-provided session ID
//     const session = sessionId || crypto.randomBytes(16).toString('hex');

//     // Not regenerating session after authentication
//     res.cookie('sessionId', session);

//     res.json({
//       authenticated: true,
//       sessionId: session // Still using potentially attacker-provided ID
//     });
//   }

//   // VULNERABLE: Cross-origin session sharing
//   async shareSession(req, res) {
//     const { targetDomain } = req.body;
//     const sessionId = req.cookies.sessionId;

//     // Bug: Sharing session with arbitrary domains
//     res.json({
//       shareUrl: `${targetDomain}/import-session?sid=${sessionId}`,
//       sessionData: {
//         id: sessionId,
//         user: req.user,
//         // Bug: Including sensitive data in shareable format
//         authToken: req.headers.authorization
//       }
//     });
//   }

//   // VULNERABLE: No session timeout
//   async extendSession(req, res) {
//     const { extensionHours } = req.body;

//     // Bug: Allowing unlimited session extension
//     const newExpiry = new Date(Date.now() + (extensionHours * 3600000));

//     res.cookie('sessionId', req.cookies.sessionId, {
//       expires: newExpiry // No maximum limit
//     });

//     res.json({
//       extended: true,
//       expiresAt: newExpiry,
//       // Bug: No session validation before extension
//       warning: 'Session extended without validation'
//     });
//   }

//   // VULNERABLE: Session data in localStorage hint
//   async getClientStorage(req, res) {
//     // Bug: Encouraging client-side session storage
//     res.json({
//       storageInstructions: {
//         localStorage: {
//           sessionId: req.cookies.sessionId,
//           userId: req.user?.id,
//           authToken: req.headers.authorization,
//           // Bug: Storing sensitive data client-side
//           apiKey: process.env.API_KEY
//         },
//         usage: 'Store this in localStorage for persistence'
//       }
//     });
//   }

//   // VULNERABLE: Subdomain session sharing
//   async configureSubdomainSession(req, res) {
//     const sessionId = crypto.randomBytes(16).toString('hex');

//     // Bug: Cookie accessible across all subdomains
//     res.cookie('globalSession', sessionId, {
//       domain: '.example.com', // Available to all subdomains
//       path: '/',
//       // Still missing security flags
//     });

//     res.json({
//       message: 'Session available to all subdomains',
//       vulnerableDomains: [
//         'evil.example.com',
//         'attacker.example.com',
//         'compromised.example.com'
//       ]
//     });
//   }

//   // VULNERABLE: Session hijacking via referrer
//   async trackSession(req, res) {
//     const sessionId = req.cookies.sessionId;
//     const referrer = req.headers.referer;

//     // Bug: Logging session ID with referrer
//     console.log(`Session ${sessionId} came from ${referrer}`);

//     // Bug: Including session in redirect
//     if (referrer) {
//       res.redirect(`${referrer}?session=${sessionId}`);
//     } else {
//       res.json({
//         tracked: true,
//         // Bug: Exposing session in response
//         sessionId: sessionId
//       });
//     }
//   }

//   // VULNERABLE: Insecure session transmission
//   async transmitSession(req, res) {
//     const { targetUrl } = req.body;
//     const sessionData = {
//       id: req.cookies.sessionId,
//       user: req.user,
//       timestamp: Date.now()
//     };

//     // Bug: Sending session data via GET request
//     const transmitUrl = `${targetUrl}?session=${JSON.stringify(sessionData)}`;

//     res.json({
//       transmitMethod: 'GET',
//       url: transmitUrl,
//       // Bug: Base64 encoding is not encryption
//       encoded: Buffer.from(JSON.stringify(sessionData)).toString('base64')
//     });
//   }
// }

// module.exports = new SessionController();
