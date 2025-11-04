const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'task_created',
      'task_updated',
      'task_deleted',
      'task_assigned',
      'task_status_changed',
      'task_moved',
      'member_added',
      'member_removed',
      'member_role_changed',
      'project_created',
      'project_updated',
      'subtask_completed',
      'subtask_created',
    ],
  },
  description: {
    type: String,
    required: true,
  },
  entityType: {
    type: String,
    enum: ['task', 'project', 'member', 'subtask'],
    default: 'task',
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ project: 1, user: 1 });

module.exports = mongoose.model('Activity', activitySchema);
