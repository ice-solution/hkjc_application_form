const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  path: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  width: {
    type: Number
  },
  height: {
    type: Number
  },
  orientation: {
    type: String,
    enum: ['landscape', 'portrait', 'square'],
    default: 'landscape'
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Album', albumSchema);
