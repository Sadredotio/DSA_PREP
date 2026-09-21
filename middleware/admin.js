const User = require('../models/User');

// Set your admin email(s) here, or override via ADMIN_EMAILS in .env
// (comma-separated for more than one admin).
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'mdsadrealam8207@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

// Must run after requireAuth (needs req.userId already set)
async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user || !isAdminEmail(user.email)) {
      return res.status(403).json({ error: 'Admin access only' });
    }
    req.adminUser = user;
    next();
  } catch (err) {
    console.error('admin check error', err);
    res.status(500).json({ error: 'Could not verify admin access' });
  }
}

module.exports = { requireAdmin, isAdminEmail, ADMIN_EMAILS };