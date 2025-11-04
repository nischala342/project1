const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    enum: ['admin', 'user'],
    lowercase: true,
    trim: true,
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'delete'],
    required: true,
  }],
  description: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Role', roleSchema);
