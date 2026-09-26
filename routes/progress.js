const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function todayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD" (UTC)
}

function yesterdayKey() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Bumps the user's streak the first time they solve something on a new day.
// Marking something solved again the same day, or un-solving it, never
// changes the streak — it only moves forward on genuinely new activity days.
function applyStreak(user) {
  const today = todayKey();
  if (user.lastActiveDate === today) return; // already counted today

  user.currentStreak =
    user.lastActiveDate === yesterdayKey() ? (user.currentStreak || 0) + 1 : 1;
  user.longestStreak = Math.max(user.longestStreak || 0, user.currentStreak);
  user.lastActiveDate = today;
}

function streakPayload(user) {
  return {
    current: user.currentStreak || 0,
    longest: user.longestStreak || 0
  };
}

// GET /api/progress  -> { "1": { solved: true, remark: "..." }, ... }
router.get('/', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    progress: Object.fromEntries(user.progress || new Map()),
    streak: streakPayload(user)
  });
});

// PUT /api/progress  { problemId: "12", solved: true, remark: "revisit" }
// Only the fields you send are updated; omit "remark" to leave it unchanged.
router.put('/', requireAuth, async (req, res) => {
  try {
    const { problemId, solved, remark } = req.body || {};
    if (problemId === undefined || problemId === null || problemId === '') {
      return res.status(400).json({ error: 'problemId is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const key = String(problemId);
    const existing = user.progress.get(key) || { solved: false, remark: '' };

    const updated = {
      solved: typeof solved === 'boolean' ? solved : existing.solved,
      remark: typeof remark === 'string' ? remark.slice(0, 2000) : existing.remark
    };

    user.progress.set(key, updated);

    // Only newly marking something solved counts toward the streak
    if (solved === true && !existing.solved) {
      applyStreak(user);
    }

    await user.save();

    res.json({
      progress: Object.fromEntries(user.progress),
      streak: streakPayload(user)
    });
  } catch (err) {
    console.error('progress update error', err);
    res.status(500).json({ error: 'Could not save your progress' });
  }
});

module.exports = router;