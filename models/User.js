const mongoose = require('mongoose');

const ProgressEntrySchema = new mongoose.Schema(
  {
    solved: { type: Boolean, default: false },
    remark: { type: String, default: '', maxlength: 2000 }
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: { type: String, required: true },
    // Data URL (base64) of a small, client-resized profile photo
    photo: { type: String, default: '' },
    // Keyed by problem number (as a string), e.g. "1": { solved: true, remark: "..." }
    progress: {
      type: Map,
      of: ProgressEntrySchema,
      default: {}
    },
    // Daily solving streak — updated whenever a problem is newly marked solved
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    // "YYYY-MM-DD" (UTC) of the last day a problem was marked solved
    lastActiveDate: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);