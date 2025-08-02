const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const userModel = require('../models/userModel');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function register(req, res) {
  const { email, username, password } = req.body;
  console.log('[register] Checking if user exists:', email);
  const existingUser = await userModel.findUserByEmail(email);
  console.log('[register] Result of findUserByEmail:', existingUser);
  if (existingUser) {
    return res.status(400).json({ error: 'Already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userModel.createUser(email, username, hashedPassword);
  req.session.userId = user.id;
  res.json({ message: 'Success', user });
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await userModel.findUserByEmail(email);
  if (!user) return res.status(400).json({ error: 'Invalid email or password' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }
  req.session.userId = user.id;
  res.json({ message: 'Success', user });
}

function logout(req, res) {
  req.session.destroy(() => res.json({ message: 'Success' }));
}

async function getCurrentUser(req, res) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = await userModel.findUserById(req.session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
}

async function googleLogin(req, res) {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) {
    console.error('[googleLogin] Missing ID token');
    return res.status(400).json({ error: 'Missing ID token' });
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    console.error('[googleLogin] GOOGLE_CLIENT_ID not configured');
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }

  console.log('[googleLogin] Backend Client ID:', process.env.GOOGLE_CLIENT_ID);
  console.log('[googleLogin] Token length:', idToken.length);

  try {
    console.log('[googleLogin] Verifying token with client ID:', process.env.GOOGLE_CLIENT_ID);
    
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log('[googleLogin] Token verified, payload:', { email: payload.email, name: payload.name });
    
    const { sub: googleId, email, name } = payload;

    let user = await userModel.findUserByGoogleId(googleId);

    if (!user) {
      user = await userModel.findUserByEmail(email);
      if (user) {
        await userModel.linkGoogleId(user.id, googleId);
        console.log('[googleLogin] Linked existing user with Google ID');
      } else {
        user = await userModel.createGoogleUser(email, name, googleId);
        console.log('[googleLogin] Created new user from Google');
      }
    } else {
      console.log('[googleLogin] Found existing Google user');
    }

    req.session.userId = user.id;
    console.log('[googleLogin] Login successful for user:', user.id);
    res.json({ message: 'Success', user });

  } catch (err) {
    console.error('[googleLogin] Error verifying token:', err);
    console.error('[googleLogin] Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    res.status(401).json({ error: 'Invalid Google token: ' + err.message });
  }
}

module.exports = { register, login, logout, getCurrentUser, googleLogin };