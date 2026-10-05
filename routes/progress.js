const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// The frontend sends the user's own local "YYYY-MM-DD" (see localDateKey()
// in public/index.html) so streaks line up with the calendar day the user
// actually sees, not the server's UTC clock. Falls back to server UTC only
// if the client didn't send one (older clients, direct API calls, etc).
function todayKey(clientDate) {
  if (typeof clientDate === 'string' && DATE_RE.test(clientDate)) {
    return clientDate;
  }
  return new Date().toISOString().slice(0, 10);
}

function dayBeforeKey(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

// Bumps the user's streak and logs today as an active day, the first time
// they solve something on a new day. Marking something solved again the
// same day, or un-solving it, never changes either — this only moves
// forward on genuinely new activity days.
function applyStreak(user, clientDate) {
  const today = todayKey(clientDate);
  if (user.lastActiveDate === today) return; // already counted today

  user.currentStreak =
    user.lastActiveDate === dayBeforeKey(today) ? (user.currentStreak || 0) + 1 : 1;
  user.longestStreak = Math.max(user.longestStreak || 0, user.currentStreak);
  user.lastActiveDate = today;

  const dates = user.activityDates || [];
  if (!dates.includes(today)) {
    dates.push(today);
    // keep only the most recent 90 days
    user.activityDates = dates.slice(-90);
  }
}

function streakPayload(user) {
  return {
    current: user.currentStreak || 0,
    longest: user.longestStreak || 0,
    days: user.activityDates || []
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
    const { problemId, solved, remark, clientDate } = req.body || {};
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
      applyStreak(user, clientDate);
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