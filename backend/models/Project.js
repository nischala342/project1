const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  key: {
    type: String,
    required: [true, 'Project key is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9]+$/, 'Project key must contain only uppercase letters and numbers'],
    maxlength: [10, 'Project key must be 10 characters or less'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

projectSchema.index({ key: 1 });
projectSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Project', projectSchema);
