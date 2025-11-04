const Activity = require('../models/Activity');

const logActivity = async (projectId, userId, action, description, entityType = 'task', entityId = null, metadata = {}) => {
  try {
    await Activity.create({
      project: projectId,
      user: userId,
      action,
      description,
      entityType,
      entityId,
      metadata,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

module.exports = {
  logActivity,
};
