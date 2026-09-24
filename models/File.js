const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    filename: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 }, // approx bytes
    data: { type: String, required: true }, // base64-encoded file content
    uploadedByName: { type: String, default: '' },
    uploadedByEmail: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('File', FileSchema);