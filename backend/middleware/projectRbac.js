const ProjectRole = require('../models/ProjectRole');

const getUserProjectRole = async (userId, projectId) => {
  const projectRole = await ProjectRole.findOne({
    user: userId,
    project: projectId,
  });
  return projectRole ? projectRole.role : null;
};

exports.checkProjectRole = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.body.projectId || req.query.projectId;
      
      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'Project ID is required',
        });
      }

      const userRole = await getUserProjectRole(req.user._id, projectId);

      if (!userRole) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You are not a member of this project.',
        });
      }

      const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      if (!rolesArray.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Required role: ${rolesArray.join(' or ')}`,
        });
      }

      req.userProjectRole = userRole;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error checking project role',
      });
    }
  };
};

exports.isProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId || req.query.projectId || req.params.id;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required',
      });
    }

    const userRole = await getUserProjectRole(req.user._id, projectId);

    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Project admin role required.',
      });
    }

    req.userProjectRole = userRole;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error checking project admin role',
    });
  }
};

exports.canManageTasks = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId || req.query.projectId;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required',
      });
    }

    const userRole = await getUserProjectRole(req.user._id, projectId);

    if (!['admin', 'manager'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or Manager role required.',
      });
    }

    req.userProjectRole = userRole;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error checking task management permissions',
    });
  }
};

exports.canCreateTasks = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId || req.query.projectId;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required',
      });
    }

    const userRole = await getUserProjectRole(req.user._id, projectId);

    if (!['admin', 'manager', 'contributor'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin, Manager, or Contributor role required.',
      });
    }

    req.userProjectRole = userRole;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error checking task creation permissions',
    });
  }
};

exports.getUserProjectRole = getUserProjectRole;
