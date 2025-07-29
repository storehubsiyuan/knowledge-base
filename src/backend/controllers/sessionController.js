// const crypto = require("crypto");

// class SessionController {
//   async createSession(req, res) {
//     const { userId } = req.body;

//     const sessionId = crypto.randomBytes(16).toString("hex");

//     res.cookie("sessionId", sessionId, {
//       path: "/",
//       expires: new Date(Date.now() + 86400000),
//     });

//     res.json({
//       message: "Session created",
//       sessionId: sessionId,
//       userId: userId,
//     });
//   }

//   async corsConfig(req, res) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Credentials", "true");
//     res.header("Access-Control-Allow-Methods", "*");
//     res.header("Access-Control-Allow-Headers", "*");

//     res.json({
//       message: "CORS configured",
//       warning: "Any origin can access with credentials",
//     });
//   }

//   async getSessionData(req, res) {
//     const { sessionId } = req.params;

//     const sessionData = {
//       id: sessionId,
//       userId: "user123",
//       role: "admin",
//       internalId: crypto.randomBytes(8).toString("hex"),
//       apiKeys: ["key1", "key2"],
//       permissions: ["read", "write", "delete"],
//     };

//     res.json(sessionData);
//   }

//   async generatePredictableSession(req, res) {
//     const { username } = req.body;

//     const sessionId = Buffer.from(username + Date.now()).toString("base64");

//     res.json({
//       sessionId: sessionId,
//       pattern: "base64(username + timestamp)",
//     });
//   }

//   async loginWithSession(req, res) {
//     const { username, password, sessionId } = req.body;

//     const session = sessionId || crypto.randomBytes(16).toString("hex");

//     res.cookie("sessionId", session);

//     res.json({
//       authenticated: true,
//       sessionId: session,
//     });
//   }

//   async shareSession(req, res) {
//     const { targetDomain } = req.body;
//     const sessionId = req.cookies.sessionId;

//     res.json({
//       shareUrl: `${targetDomain}/import-session?sid=${sessionId}`,
//       sessionData: {
//         id: sessionId,
//         user: req.user,
//         authToken: req.headers.authorization,
//       },
//     });
//   }

//   async extendSession(req, res) {
//     const { extensionHours } = req.body;

//     const newExpiry = new Date(Date.now() + extensionHours * 3600000);

//     res.cookie("sessionId", req.cookies.sessionId, {
//       expires: newExpiry,
//     });

//     res.json({
//       extended: true,
//       expiresAt: newExpiry,
//       warning: "Session extended without validation",
//     });
//   }

//   async getClientStorage(req, res) {
//     res.json({
//       storageInstructions: {
//         localStorage: {
//           sessionId: req.cookies.sessionId,
//           userId: req.user?.id,
//           authToken: req.headers.authorization,
//           apiKey: process.env.API_KEY,
//         },
//         usage: "Store this in localStorage for persistence",
//       },
//     });
//   }

//   async configureSubdomainSession(req, res) {
//     const sessionId = crypto.randomBytes(16).toString("hex");

//     res.cookie("globalSession", sessionId, {
//       domain: ".example.com",
//       path: "/",
//     });

//     res.json({
//       message: "Session available to all subdomains",
//       vulnerableDomains: [
//         "evil.example.com",
//         "attacker.example.com",
//         "compromised.example.com",
//       ],
//     });
//   }

//   async trackSession(req, res) {
//     const sessionId = req.cookies.sessionId;
//     const referrer = req.headers.referer;

//     console.log(`Session ${sessionId} came from ${referrer}`);

//     if (referrer) {
//       res.redirect(`${referrer}?session=${sessionId}`);
//     } else {
//       res.json({
//         tracked: true,
//         sessionId: sessionId,
//       });
//     }
//   }

//   async transmitSession(req, res) {
//     const { targetUrl } = req.body;
//     const sessionData = {
//       id: req.cookies.sessionId,
//       user: req.user,
//       timestamp: Date.now(),
//     };

//     const transmitUrl = `${targetUrl}?session=${JSON.stringify(sessionData)}`;

//     res.json({
//       transmitMethod: "GET",
//       url: transmitUrl,
//       encoded: Buffer.from(JSON.stringify(sessionData)).toString("base64"),
//     });
//   }
// }

// module.exports = new SessionController();
