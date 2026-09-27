const express = require('express');
const HelpRequest = require('../models/HelpRequest');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

// POST /api/help — any logged-in user. { subject, message }
router.post('/', requireAuth, async (req, res) => {
  try {
    const { subject, message } = req.body || {};
    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Subject is required' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const user = await User.findById(req.userId).select('name email');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const request = await HelpRequest.create({
      userId: user._id,
      name: user.name,
      email: user.email,
      subject: subject.trim(),
      message: message.trim()
    });

    res.status(201).json({ request });
  } catch (err) {
    console.error('help submit error', err);
    res.status(500).json({ error: 'Could not send your message' });
  }
});

// GET /api/help — admin only. All submitted queries, newest first.
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const requests = await HelpRequest.find().sort({ createdAt: -1 }).lean();
    res.json({ requests });
  } catch (err) {
    console.error('help list error', err);
    res.status(500).json({ error: 'Could not load messages' });
  }
});

// PATCH /api/help/:id — admin only. { status: "resolved" | "open" }
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['open', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'status must be "open" or "resolved"' });
    }
    const request = await HelpRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!request) return res.status(404).json({ error: 'Message not found' });
    res.json({ request });
  } catch (err) {
    console.error('help update error', err);
    res.status(500).json({ error: 'Could not update message' });
  }
});

module.exports = router;