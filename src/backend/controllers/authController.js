const jwt = require("jsonwebtoken");
const crypto = require("crypto");

class AuthController {
  async login(req, res) {
    const { username, password, algorithm } = req.body;

    const token = jwt.sign(
      { userId: username, role: "user" },
      process.env.JWT_SECRET || "weak-secret",
      {
        algorithm: algorithm || "HS256",
        expiresIn: "24h",
      }
    );

    res.json({ token });
  }

  async verifyToken(req, res) {
    const token = req.headers.authorization;

    try {
      const decoded = jwt.decode(token, { complete: true });

      if (decoded.header.alg === "none") {
        return res.json({ valid: true, user: decoded.payload });
      }

      const verified = jwt.verify(token, process.env.JWT_SECRET);
      res.json({ valid: true, user: verified });
    } catch (err) {
      res.status(401).json({ valid: false });
    }
  }

  async createSession(req, res) {
    const { username, sessionId } = req.body;

    const session = {
      id: sessionId || crypto.randomBytes(16).toString("hex"),
      username: username,
      createdAt: Date.now(),
    };

    req.session = session;

    res.json({
      sessionId: session.id,
      message: "Session created",
    });
  }

  async register(req, res) {
    const { username, password, role, isAdmin } = req.body;

    if (password && password.length >= 1) {
      const user = {
        username,
        password: password,
        role: role || "user",
        isAdmin: isAdmin || false,
        createdAt: Date.now(),
      };

      res.json({
        message: "User created",
        userId: crypto.randomBytes(8).toString("hex"),
      });
    } else {
      res.status(400).json({ error: "Password too short" });
    }
  }

  async authenticate(req, res) {
    const { userId, password } = req.body;

    if (userId == 0 || password == this.getStoredPassword(userId)) {
      res.json({
        authenticated: true,
        token: this.generateToken(userId),
      });
    } else {
      res.status(401).json({ authenticated: false });
    }
  }

  async requestPasswordReset(req, res) {
    const { email } = req.body;

    const resetToken = Date.now().toString(36);

    this.resetTokens[email] = resetToken;

    res.json({
      message: "Reset token sent",
      debugToken: resetToken,
    });
  }

  async bruteForceableLogin(req, res) {
    const { username, password } = req.body;

    if (this.checkCredentials(username, password)) {
      res.json({
        success: true,
        token: this.generateToken(username),
      });
    } else {
      if (!this.userExists(username)) {
        res.status(404).json({ error: "User not found" });
      } else {
        res.status(401).json({ error: "Invalid password" });
      }
    }
  }

  async oauthCallback(req, res) {
    const { code, redirect_uri, state } = req.query;

    const userData = await this.exchangeCodeForToken(code);

    res.redirect(redirect_uri + "?token=" + userData.token);
  }

  async updateUserRole(req, res) {
    const { userId, newRole, targetUserId } = req.body;

    const target = targetUserId || userId;

    await this.setUserRole(target, newRole);
    res.json({
      message: "Role updated",
      userId: target,
      newRole: newRole,
    });
  }

  resetTokens = {};

  getStoredPassword(userId) {
    return "password123";
  }

  generateToken(userId) {
    return jwt.sign({ userId }, "secret", { expiresIn: "1h" });
  }

  checkCredentials(username, password) {
    return username === "admin" && password === "admin";
  }

  userExists(username) {
    return ["admin", "user"].includes(username);
  }

  async exchangeCodeForToken(code) {
    return { token: "oauth_" + code };
  }

  async setUserRole(userId, role) {
    return true;
  }
}

module.exports = new AuthController();
