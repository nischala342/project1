const User = require('../models/User');
const Role = require('../models/Role');

exports.checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).populate('role');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
        });
      }

      if (!user.role) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. No role assigned.',
        });
      }

      const hasPermission = user.role.permissions.includes(requiredPermission);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Required permission: ${requiredPermission}`,
        });
      }

      req.userRole = user.role;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error checking permissions',
      });
    }
  };
};

exports.checkAnyPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).populate('role');
      
      if (!user || !user.role) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. No role assigned.',
        });
      }

      const hasPermission = requiredPermissions.some(permission => 
        user.role.permissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Required one of: ${requiredPermissions.join(', ')}`,
        });
      }

      req.userRole = user.role;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error checking permissions',
      });
    }
  };
};

exports.checkAllPermissions = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).populate('role');
      
      if (!user || !user.role) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. No role assigned.',
        });
      }

      const hasAllPermissions = requiredPermissions.every(permission => 
        user.role.permissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Required all of: ${requiredPermissions.join(', ')}`,
        });
      }

      req.userRole = user.role;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error checking permissions',
      });
    }
  };
};

exports.isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('role');
    
    if (!user || !user.role) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. No role assigned.',
      });
    }

    if (user.role.name !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.',
      });
    }

    req.userRole = user.role;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error checking admin role',
    });
  }
};
