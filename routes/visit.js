const express = require('express');
const User = require('../models/User');
const Visit = require('../models/Visit');
const { optionalAuth } = require('../middleware/optionalAuth');

const router = express.Router();

// POST /api/visit  { path: "/" }
// Called once per page load from the frontend. Works whether or not the
// visitor is logged in — if they are (Authorization header present and
// valid), the visit is tagged with their name/email; otherwise it's
// recorded as anonymous (still with IP + timestamp).
router.post('/', optionalAuth, async (req, res) => {
  try {
    let name = '';
    let email = '';

    if (req.userId) {
      const user = await User.findById(req.userId).select('name email');
      if (user) {
        name = user.name;
        email = user.email;
      }
    }

    const ip =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket.remoteAddress ||
      '';

    await Visit.create({
      userId: req.userId || null,
      name,
      email,
      path: (req.body && req.body.path) || '/',
      ip,
      userAgent: req.headers['user-agent'] || '',
      at: new Date()
    });

    res.status(204).end();
  } catch (err) {
    console.error('visit log error', err);
    // Never let visit logging break the app for the visitor
    res.status(204).end();
  }
});

module.exports = router;