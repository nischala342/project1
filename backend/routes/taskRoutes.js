const express = require('express');
const router = express.Router({ mergeParams: true });
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const { 
  canCreateTasks, 
  canManageTasks, 
  checkProjectRole,
  getUserProjectRole 
} = require('../middleware/projectRbac');
const { logActivity } = require('../utils/activityLogger');

router.get('/', protect, checkProjectRole(['admin', 'manager', 'contributor', 'viewer']), async (req, res) => {
  try {
    const { status, assignedTo } = req.query;
    const projectId = req.params.projectId;
    let query = { project: projectId };

    if (status) {
      query.status = status;
    }
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email profilePicture')
      .populate('createdBy', 'name email')
      .sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/:id', protect, checkProjectRole(['admin', 'manager', 'contributor', 'viewer']), async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email profilePicture')
      .populate('createdBy', 'name email');

    if (!task || task.project.toString() !== projectId) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/', protect, canCreateTasks, async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, dueDate, tags, subtasks } = req.body;
    const projectId = req.params.projectId;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required',
      });
    }

    const maxOrderTask = await Task.findOne({ 
      project: projectId, 
      status: status || 'todo' 
    }).sort({ order: -1 });
    
    const order = maxOrderTask ? maxOrderTask.order + 1 : 0;

    const task = await Task.create({
      project: projectId,
      title,
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      dueDate: dueDate || null,
      tags: tags || [],
      subtasks: subtasks || [],
      order,
    });

    await task.populate('assignedTo', 'name email profilePicture');
    await task.populate('createdBy', 'name email');

    await logActivity(
      projectId,
      req.user._id,
      'task_created',
      `Created task "${task.title}"`,
      'task',
      task._id,
      { taskTitle: task.title, status: task.status, priority: task.priority }
    );

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const task = await Task.findById(req.params.id);
    
    if (!task || task.project.toString() !== projectId) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    const userRole = await getUserProjectRole(req.user._id, projectId);
    
    if (userRole === 'contributor') {
      if (task.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'You can only update tasks assigned to you',
        });
      }
    } else if (!['admin', 'manager', 'contributor'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const { title, description, status, priority, assignedTo, dueDate, tags, subtasks, order } = req.body;

    if (status && status !== task.status) {
      const maxOrderTask = await Task.findOne({ 
        project: projectId, 
        status 
      }).sort({ order: -1 });
      
      if (order === undefined) {
        req.body.order = maxOrderTask ? maxOrderTask.order + 1 : 0;
      }
    }

    const oldTask = task;
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        status,
        priority,
        assignedTo,
        dueDate,
        tags,
        subtasks,
        order,
      },
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email profilePicture')
      .populate('createdBy', 'name email');

    let action = 'task_updated';
    let activityDescription = `Updated task "${updatedTask.title}"`;

    if (status && status !== oldTask.status) {
      action = 'task_status_changed';
      activityDescription = `Changed task "${updatedTask.title}" status from ${oldTask.status} to ${status}`;
    } else if (assignedTo && assignedTo.toString() !== (oldTask.assignedTo?.toString() || '')) {
      action = 'task_assigned';
      activityDescription = `Assigned task "${updatedTask.title}" to ${updatedTask.assignedTo?.name || 'user'}`;
    }

    await logActivity(
      projectId,
      req.user._id,
      action,
      activityDescription,
      'task',
      updatedTask._id,
      { taskTitle: updatedTask.title, changes: { status, priority, assignedTo } }
    );

    res.json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

router.put('/:id/move', protect, canCreateTasks, async (req, res) => {
  try {
    const { status, order } = req.body;
    const projectId = req.params.projectId;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    const task = await Task.findById(req.params.id);
    
    if (!task || task.project.toString() !== projectId) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    if (order !== undefined) {
      await Task.updateMany(
        {
          project: projectId,
          status,
          order: { $gte: order },
          _id: { $ne: req.params.id },
        },
        { $inc: { order: 1 } }
      );
    }

    const oldStatus = task.status;
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        order: order !== undefined ? order : task.order,
      },
      { new: true }
    )
      .populate('assignedTo', 'name email profilePicture')
      .populate('createdBy', 'name email');

    await logActivity(
      req.params.projectId,
      req.user._id,
      'task_moved',
      `Moved task "${updatedTask.title}" from ${oldStatus} to ${status}`,
      'task',
      updatedTask._id,
      { taskTitle: updatedTask.title, fromStatus: oldStatus, toStatus: status }
    );

    res.json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete('/:id', protect, canManageTasks, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const task = await Task.findById(req.params.id);
    
    if (!task || task.project.toString() !== projectId) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    await logActivity(
      projectId,
      req.user._id,
      'task_deleted',
      `Deleted task "${task.title}"`,
      'task',
      task._id,
      { taskTitle: task.title }
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

module.exports = router;
