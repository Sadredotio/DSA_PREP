const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/progress  -> { "1": { solved: true, remark: "..." }, ... }
router.get('/', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ progress: Object.fromEntries(user.progress || new Map()) });
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
    await user.save();

    res.json({ progress: Object.fromEntries(user.progress) });
  } catch (err) {
    console.error('progress update error', err);
    res.status(500).json({ error: 'Could not save your progress' });
  }
});

module.exports = router;
