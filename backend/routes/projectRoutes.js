const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const ProjectRole = require('../models/ProjectRole');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { isProjectAdmin, checkProjectRole, getUserProjectRole } = require('../middleware/projectRbac');
const { logActivity } = require('../utils/activityLogger');

const taskRoutes = require('./taskRoutes');

router.get('/', protect, async (req, res) => {
  try {
    const projectRoles = await ProjectRole.find({ user: req.user._id }).populate('project');
    const projects = projectRoles.map(pr => ({
      ...pr.project.toObject(),
      role: pr.role,
    }));

    res.json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    const userRole = await getUserProjectRole(req.user._id, req.params.id);

    if (!userRole) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this project.',
      });
    }

    res.json({
      success: true,
      data: {
        ...project.toObject(),
        userRole,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { name, description, key } = req.body;

    if (!name || !key) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name and key',
      });
    }

    const existingProject = await Project.findOne({ key: key.toUpperCase() });
    if (existingProject) {
      return res.status(400).json({
        success: false,
        error: 'Project key already exists',
      });
    }

    const project = await Project.create({
      name,
      description,
      key: key.toUpperCase(),
      createdBy: req.user._id,
    });

    await ProjectRole.create({
      project: project._id,
      user: req.user._id,
      role: 'admin',
    });

    await logActivity(
      project._id,
      req.user._id,
      'project_created',
      `Created project "${project.name}"`,
      'project',
      project._id,
      { projectName: project.name, projectKey: project.key }
    );

    const projectWithRole = {
      ...project.toObject(),
      role: 'admin',
    };

    res.status(201).json({
      success: true,
      data: projectWithRole,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Project key already exists',
      });
    }
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

router.put('/:id', protect, isProjectAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;

    const oldProject = await Project.findById(req.params.id);
    if (!oldProject) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );

    await logActivity(
      req.params.id,
      req.user._id,
      'project_updated',
      `Updated project "${project.name}"`,
      'project',
      project._id,
      { 
        projectName: project.name, 
        changes: { 
          name: name !== oldProject.name ? { from: oldProject.name, to: name } : undefined,
          description: description !== oldProject.description 
        } 
      }
    );

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete('/:id', protect, isProjectAdmin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    const Task = require('../models/Task');
    const Activity = require('../models/Activity');

    await Task.deleteMany({ project: req.params.id });
    
    await ProjectRole.deleteMany({ project: req.params.id });
    
    await Activity.deleteMany({ project: req.params.id });

    await Project.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Project and all related data deleted successfully',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/:projectId/members', protect, checkProjectRole(['admin', 'manager', 'contributor', 'viewer']), async (req, res) => {
  try {
    const projectRoles = await ProjectRole.find({ project: req.params.projectId })
      .populate('user', 'name email profilePicture')
      .sort({ role: 1, createdAt: 1 });

    res.json({
      success: true,
      count: projectRoles.length,
      data: projectRoles.map(pr => ({
        user: pr.user,
        role: pr.role,
        joinedAt: pr.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/:projectId/members', protect, isProjectAdmin, async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        error: 'Please provide userId and role',
      });
    }

    if (!['admin', 'manager', 'contributor', 'viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be: admin, manager, contributor, or viewer',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const existingRole = await ProjectRole.findOne({
      project: req.params.projectId,
      user: userId,
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this project',
      });
    }

    const projectRole = await ProjectRole.create({
      project: req.params.projectId,
      user: userId,
      role,
    });

    await projectRole.populate('user', 'name email profilePicture');

    await logActivity(
      req.params.projectId,
      req.user._id,
      'member_added',
      `Added ${projectRole.user.name} as ${role}`,
      'member',
      userId,
      { memberName: projectRole.user.name, role }
    );

    res.status(201).json({
      success: true,
      data: {
        user: projectRole.user,
        role: projectRole.role,
        joinedAt: projectRole.createdAt,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

router.put('/:projectId/members/:userId', protect, isProjectAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Please provide role',
      });
    }

    if (!['admin', 'manager', 'contributor', 'viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be: admin, manager, contributor, or viewer',
      });
    }

    const oldProjectRole = await ProjectRole.findOne({
      project: req.params.projectId,
      user: req.params.userId,
    });

    const projectRole = await ProjectRole.findOneAndUpdate(
      {
        project: req.params.projectId,
        user: req.params.userId,
      },
      { role },
      { new: true }
    ).populate('user', 'name email profilePicture');

    if (!projectRole) {
      return res.status(404).json({
        success: false,
        error: 'Project member not found',
      });
    }

    await logActivity(
      req.params.projectId,
      req.user._id,
      'member_role_changed',
      `Changed ${projectRole.user.name}'s role from ${oldProjectRole?.role} to ${role}`,
      'member',
      req.params.userId,
      { memberName: projectRole.user.name, oldRole: oldProjectRole?.role, newRole: role }
    );

    res.json({
      success: true,
      data: {
        user: projectRole.user,
        role: projectRole.role,
        joinedAt: projectRole.createdAt,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete('/:projectId/members/:userId', protect, isProjectAdmin, async (req, res) => {
  try {
    const adminCount = await ProjectRole.countDocuments({
      project: req.params.projectId,
      role: 'admin',
    });

    const userRole = await ProjectRole.findOne({
      project: req.params.projectId,
      user: req.params.userId,
    });

    if (userRole && userRole.role === 'admin' && adminCount === 1) {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove the last admin from the project',
      });
    }

    const projectRole = await ProjectRole.findOne({
      project: req.params.projectId,
      user: req.params.userId,
    }).populate('user', 'name email');

    if (!projectRole) {
      return res.status(404).json({
        success: false,
        error: 'Project member not found',
      });
    }

    await ProjectRole.findOneAndDelete({
      project: req.params.projectId,
      user: req.params.userId,
    });

    await logActivity(
      req.params.projectId,
      req.user._id,
      'member_removed',
      `Removed ${projectRole.user.name} from project`,
      'member',
      req.params.userId,
      { memberName: projectRole.user.name }
    );

    res.json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.use('/:projectId/tasks', taskRoutes);

module.exports = router;
