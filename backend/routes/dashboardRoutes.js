const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const ProjectRole = require('../models/ProjectRole');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');
const { getUserProjectRole } = require('../middleware/projectRbac');

router.get('/overview', protect, async (req, res) => {
  try {
    const projectRoles = await ProjectRole.find({ user: req.user._id });
    const projectIds = projectRoles.map(pr => pr.project);

    const assignedTasks = await Task.find({
      assignedTo: req.user._id,
      project: { $in: projectIds },
    })
      .populate('project', 'name key')
      .sort({ dueDate: 1, createdAt: -1 });

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const upcomingDeadlines = assignedTasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate <= nextWeek;
    });

    const overdueTasks = assignedTasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < today && task.status !== 'done';
    });

    const tasksByStatus = {
      todo: assignedTasks.filter(t => t.status === 'todo').length,
      'in-progress': assignedTasks.filter(t => t.status === 'in-progress').length,
      'in-review': assignedTasks.filter(t => t.status === 'in-review').length,
      done: assignedTasks.filter(t => t.status === 'done').length,
    };

    res.json({
      success: true,
      data: {
        totalAssignedTasks: assignedTasks.length,
        tasksByStatus,
        upcomingDeadlines: upcomingDeadlines.slice(0, 10),
        overdueTasks: overdueTasks.slice(0, 10),
        totalProjects: projectIds.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/projects/:projectId/progress', protect, async (req, res) => {
  try {
    const userRole = await getUserProjectRole(req.user._id, req.params.projectId);
    
    if (!userRole) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this project.',
      });
    }

    const tasks = await Task.find({ project: req.params.projectId });
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const completionPercentage = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    const statusBreakdown = {
      todo: tasks.filter(t => t.status === 'todo').length,
      'in-progress': tasks.filter(t => t.status === 'in-progress').length,
      'in-review': tasks.filter(t => t.status === 'in-review').length,
      done: tasks.filter(t => t.status === 'done').length,
    };

    const priorityBreakdown = {
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };

    const totalSubtasks = tasks.reduce((sum, task) => sum + (task.subtasks?.length || 0), 0);
    const completedSubtasks = tasks.reduce((sum, task) => {
      return sum + (task.subtasks?.filter(st => st.completed).length || 0);
    }, 0);
    const subtaskCompletionPercentage = totalSubtasks > 0
      ? Math.round((completedSubtasks / totalSubtasks) * 100)
      : 0;

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const upcomingDeadlines = tasks
      .filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate <= nextWeek && task.status !== 'done';
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 10)
      .map(task => ({
        id: task._id,
        title: task.title,
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
      }));

    const overdueTasks = tasks
      .filter(task => {
        if (!task.dueDate) return false;
        return new Date(task.dueDate) < today && task.status !== 'done';
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .map(task => ({
        id: task._id,
        title: task.title,
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
        daysOverdue: Math.floor((today - new Date(task.dueDate)) / (1000 * 60 * 60 * 24)),
      }));

    res.json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        completionPercentage,
        statusBreakdown,
        priorityBreakdown,
        subtasks: {
          total: totalSubtasks,
          completed: completedSubtasks,
          completionPercentage: subtaskCompletionPercentage,
        },
        upcomingDeadlines,
        overdueTasks,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/projects/:projectId/activity', protect, async (req, res) => {
  try {
    const userRole = await getUserProjectRole(req.user._id, req.params.projectId);
    
    if (!userRole) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this project.',
      });
    }

    const { limit = 50 } = req.query;

    const activities = await Activity.find({ project: req.params.projectId })
      .populate('user', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/my-tasks', protect, async (req, res) => {
  try {
    const { status, priority } = req.query;
    
    const projectRoles = await ProjectRole.find({ user: req.user._id });
    const projectIds = projectRoles.map(pr => pr.project);

    let query = {
      assignedTo: req.user._id,
      project: { $in: projectIds },
    };

    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }

    const tasks = await Task.find(query)
      .populate('project', 'name key')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, createdAt: -1 });

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

module.exports = router;
