const mongoose = require('mongoose');

const VisitSchema = new mongoose.Schema(
  {
    // Set when the visitor is logged in; null/undefined for anonymous visits
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    path: { type: String, default: '/' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    at: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

VisitSchema.index({ at: -1 });

module.exports = mongoose.model('Visit', VisitSchema);