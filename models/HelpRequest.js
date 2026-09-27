const mongoose = require('mongoose');

const HelpRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    subject: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('HelpRequest', HelpRequestSchema);