const express = require('express');
const User = require('../models/User');
const Visit = require('../models//Visit');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

// All routes below require: logged in AND email is in the admin allowlist
router.use(requireAuth, requireAdmin);

// GET /api/admin/visits?limit=200
router.get('/visits', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);
    const visits = await Visit.find().sort({ at: -1 }).limit(limit).lean();
    res.json({ visits });
  } catch (err) {
    console.error('admin visits error', err);
    res.status(500).json({ error: 'Could not load visits' });
  }
});

// GET /api/admin/summary
router.get('/summary', async (req, res) => {
  try {
    const [totalUsers, totalVisits, uniqueVisitorEmails] = await Promise.all([
      User.countDocuments(),
      Visit.countDocuments(),
      Visit.distinct('email', { email: { $ne: '' } })
    ]);

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const visits24h = await Visit.countDocuments({ at: { $gte: since24h } });

    res.json({
      totalUsers,
      totalVisits,
      uniqueLoggedInVisitors: uniqueVisitorEmails.length,
      visits24h
    });
  } catch (err) {
    console.error('admin summary error', err);
    res.status(500).json({ error: 'Could not load summary' });
  }
});

module.exports = router;