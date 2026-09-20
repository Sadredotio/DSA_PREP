const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    photo: user.photo || '',
    progress: Object.fromEntries(user.progress || new Map())
  };
}

// POST /api/auth/signup  { name, email, password }
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash
    });

    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('signup error', err);
    res.status(500).json({ error: 'Something went wrong creating your account' });
  }
});

// POST /api/auth/login  { email, password }
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'Something went wrong logging you in' });
  }
});

// GET /api/auth/me  (requires Authorization: Bearer <token>)
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

// PUT /api/auth/photo  { photo: "data:image/png;base64,..." }
// Send an empty string to remove the photo.
router.put('/photo', requireAuth, async (req, res) => {
  try {
    const { photo } = req.body || {};
    if (typeof photo !== 'string') {
      return res.status(400).json({ error: 'photo must be a string (data URL) or empty' });
    }
    if (photo && !photo.startsWith('data:image/')) {
      return res.status(400).json({ error: 'photo must be an image data URL' });
    }
    // ~1.4MB of base64 text covers roughly a 1MB image after client-side resizing
    if (photo.length > 1_400_000) {
      return res.status(413).json({ error: 'Photo is too large — please use a smaller image' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { photo },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('photo update error', err);
    res.status(500).json({ error: 'Could not save your photo' });
  }
});

module.exports = router;