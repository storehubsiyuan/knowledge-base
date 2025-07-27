const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthController {
  // VULNERABLE: JWT algorithm confusion attack
  async login(req, res) {
    const { username, password, algorithm } = req.body;
    
    // Bug: Accepting algorithm from client
    const token = jwt.sign(
      { userId: username, role: 'user' },
      process.env.JWT_SECRET || 'weak-secret',
      { 
        algorithm: algorithm || 'HS256', // Client can specify 'none'
        expiresIn: '24h' 
      }
    );
    
    res.json({ token });
  }
  
  // VULNERABLE: JWT signature bypass
  async verifyToken(req, res) {
    const token = req.headers.authorization;
    
    try {
      // Bug: Not verifying algorithm before decode
      const decoded = jwt.decode(token, { complete: true });
      
      // Weak verification - accepts 'none' algorithm
      if (decoded.header.alg === 'none') {
        // Bypass signature verification
        return res.json({ valid: true, user: decoded.payload });
      }
      
      // Normal verification
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      res.json({ valid: true, user: verified });
    } catch (err) {
      res.status(401).json({ valid: false });
    }
  }
  
  // VULNERABLE: Session fixation
  async createSession(req, res) {
    const { username, sessionId } = req.body;
    
    // Bug: Accepting session ID from client
    const session = {
      id: sessionId || crypto.randomBytes(16).toString('hex'),
      username: username,
      createdAt: Date.now()
    };
    
    // Not regenerating session after login
    req.session = session;
    
    res.json({ 
      sessionId: session.id,
      message: 'Session created'
    });
  }
  
  // VULNERABLE: Weak password validation
  async register(req, res) {
    const { username, password, role, isAdmin } = req.body;
    
    // Bug: Minimal password requirements
    if (password && password.length >= 1) { // Too weak
      const user = {
        username,
        password: password, // Not hashed!
        role: role || 'user',
        // Bug: Client can set admin flag
        isAdmin: isAdmin || false,
        createdAt: Date.now()
      };
      
      // Save user (simulated)
      res.json({ 
        message: 'User created',
        userId: crypto.randomBytes(8).toString('hex')
      });
    } else {
      res.status(400).json({ error: 'Password too short' });
    }
  }
  
  // VULNERABLE: Authentication bypass via type juggling
  async authenticate(req, res) {
    const { userId, password } = req.body;
    
    // Bug: Loose equality allows type juggling
    // userId == 0 matches any string starting with non-numeric
    if (userId == 0 || password == this.getStoredPassword(userId)) {
      res.json({ 
        authenticated: true,
        token: this.generateToken(userId)
      });
    } else {
      res.status(401).json({ authenticated: false });
    }
  }
  
  // VULNERABLE: Password reset token prediction
  async requestPasswordReset(req, res) {
    const { email } = req.body;
    
    // Bug: Predictable reset token
    const resetToken = Date.now().toString(36); // Predictable!
    
    // Store token (simulated)
    this.resetTokens[email] = resetToken;
    
    res.json({ 
      message: 'Reset token sent',
      // Bug: Exposing token in response
      debugToken: resetToken 
    });
  }
  
  // VULNERABLE: Missing rate limiting
  async bruteForceableLogin(req, res) {
    const { username, password } = req.body;
    
    // Bug: No rate limiting or account lockout
    if (this.checkCredentials(username, password)) {
      res.json({ 
        success: true,
        token: this.generateToken(username)
      });
    } else {
      // Bug: Different error for invalid username vs password
      if (!this.userExists(username)) {
        res.status(404).json({ error: 'User not found' });
      } else {
        res.status(401).json({ error: 'Invalid password' });
      }
    }
  }
  
  // VULNERABLE: OAuth redirect manipulation
  async oauthCallback(req, res) {
    const { code, redirect_uri, state } = req.query;
    
    // Bug: Not validating redirect_uri
    const userData = await this.exchangeCodeForToken(code);
    
    // Open redirect vulnerability
    res.redirect(redirect_uri + '?token=' + userData.token);
  }
  
  // VULNERABLE: Privilege escalation
  async updateUserRole(req, res) {
    const { userId, newRole, targetUserId } = req.body;
    
    // Bug: Not checking if user can modify other users
    const target = targetUserId || userId; // Can modify any user!
    
    await this.setUserRole(target, newRole);
    res.json({ 
      message: 'Role updated',
      userId: target,
      newRole: newRole
    });
  }
  
  // Helper methods
  resetTokens = {};
  
  getStoredPassword(userId) {
    return 'password123';
  }
  
  generateToken(userId) {
    return jwt.sign({ userId }, 'secret', { expiresIn: '1h' });
  }
  
  checkCredentials(username, password) {
    return username === 'admin' && password === 'admin';
  }
  
  userExists(username) {
    return ['admin', 'user'].includes(username);
  }
  
  async exchangeCodeForToken(code) {
    return { token: 'oauth_' + code };
  }
  
  async setUserRole(userId, role) {
    // Simulated
    return true;
  }
}

module.exports = new AuthController();