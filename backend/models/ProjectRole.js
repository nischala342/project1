const mongoose = require('mongoose');

const projectRoleSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'contributor', 'viewer'],
    required: [true, 'Role is required'],
    lowercase: true,
  },
}, {
  timestamps: true,
});

projectRoleSchema.index({ project: 1, user: 1 }, { unique: true });

projectRoleSchema.index({ project: 1 });
projectRoleSchema.index({ user: 1 });

module.exports = mongoose.model('ProjectRole', projectRoleSchema);
