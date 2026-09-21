require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const progressRoutes = require('./routes/progress');
const visitRoutes = require('./routes/visit');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// --- MongoDB connection, cached across invocations (needed on serverless) ---
let cachedConnection = null;
function connectDB() {
  if (cachedConnection) return cachedConnection;
  cachedConnection = mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => mongoose.connection);
  return cachedConnection;
}

// Make sure a DB connection exists before handling any request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/visit', visitRoutes);
app.use('/api/admin', adminRoutes);

// Serve the frontend (public/index.html + public/data/problems.json)
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Only start a listening server when run directly (local dev with `npm start`).
// On Vercel, this file is imported as a serverless function instead —
// Vercel calls the exported app itself, it never runs this block.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      console.log('Connected to MongoDB');
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB:', err.message);
      process.exit(1);
    });
}

module.exports = app;