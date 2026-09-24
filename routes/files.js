const express = require('express');
const File = require('../models/File');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

const MAX_FILE_BYTES = 8 * 1024 * 1024; // ~8MB

// GET /api/files — any logged-in user. List metadata only (no file content,
// so this stays fast even with many/large files).
router.get('/', requireAuth, async (req, res) => {
  try {
    const files = await File.find().select('-data').sort({ createdAt: -1 }).lean();
    res.json({ files });
  } catch (err) {
    console.error('list files error', err);
    res.status(500).json({ error: 'Could not load files' });
  }
});

// POST /api/files — admin only. { title, description, filename, mimeType, dataBase64 }
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, filename, mimeType, dataBase64 } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!filename || !dataBase64) {
      return res.status(400).json({ error: 'A file is required' });
    }

    const approxBytes = Math.floor((dataBase64.length * 3) / 4);
    if (approxBytes > MAX_FILE_BYTES) {
      return res.status(413).json({ error: 'File is too large (max ~8MB)' });
    }

    const admin = req.adminUser; // set by requireAdmin

    const file = await File.create({
      title: title.trim(),
      description: (description || '').trim(),
      filename,
      mimeType: mimeType || 'application/octet-stream',
      size: approxBytes,
      data: dataBase64,
      uploadedByName: admin.name,
      uploadedByEmail: admin.email
    });

    const obj = file.toObject();
    delete obj.data;
    res.status(201).json({ file: obj });
  } catch (err) {
    console.error('upload file error', err);
    res.status(500).json({ error: 'Could not upload file' });
  }
});

// GET /api/files/:id/content?mode=view|download — any logged-in user.
router.get('/:id/content', requireAuth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const buffer = Buffer.from(file.data, 'base64');
    const disposition = req.query.mode === 'view' ? 'inline' : 'attachment';

    res.set('Content-Type', file.mimeType || 'application/octet-stream');
    res.set(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(file.filename)}"`
    );
    res.set('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error('fetch file content error', err);
    res.status(500).json({ error: 'Could not fetch file' });
  }
});

// DELETE /api/files/:id — admin only.
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const file = await File.findByIdAndDelete(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.status(204).end();
  } catch (err) {
    console.error('delete file error', err);
    res.status(500).json({ error: 'Could not delete file' });
  }
});

module.exports = router;