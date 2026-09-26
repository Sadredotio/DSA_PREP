const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/leaderboard — any logged-in user.
// Ranked by problems solved, then by current streak.
router.get('/', requireAuth, async (req, res) => {
  try {
    const users = await User.find()
      .select('name photo progress currentStreak longestStreak')
      .lean();

    const rows = users.map((u) => {
      const solvedCount = Object.values(u.progress || {}).filter(
        (p) => p && p.solved
      ).length;
      return {
        name: u.name,
        photo: u.photo || '',
        solvedCount,
        currentStreak: u.currentStreak || 0,
        longestStreak: u.longestStreak || 0
      };
    });

    rows.sort(
      (a, b) => b.solvedCount - a.solvedCount || b.currentStreak - a.currentStreak
    );

    res.json({ leaderboard: rows });
  } catch (err) {
    console.error('leaderboard error', err);
    res.status(500).json({ error: 'Could not load leaderboard' });
  }
});

module.exports = router;