const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { isAdmin, checkPermission } = require('../middleware/rbac');

router.get('/', protect, checkPermission('read'), async (req, res) => {
  try {
    const roles = await Role.find().select('-__v');
    res.json({
      success: true,
      count: roles.length,
      data: roles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/:id', protect, checkPermission('read'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }
    
    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { name, permissions, description } = req.body;

    if (!name || !permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name and permissions array',
      });
    }

    const validPermissions = ['read', 'write', 'delete'];
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid permissions: ${invalidPermissions.join(', ')}`,
      });
    }

    const role = await Role.create({
      name,
      permissions,
      description,
    });

    res.status(201).json({
      success: true,
      data: role,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Role already exists',
      });
    }
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { permissions, description } = req.body;

    if (permissions) {
      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          error: 'Permissions must be an array',
        });
      }
      const validPermissions = ['read', 'write', 'delete'];
      const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
      if (invalidPermissions.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid permissions: ${invalidPermissions.join(', ')}`,
        });
      }
    }

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { permissions, description },
      { new: true, runValidators: true }
    );

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const usersWithRole = await User.countDocuments({ role: req.params.id });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete role. ${usersWithRole} user(s) are assigned this role.`,
      });
    }

    const role = await Role.findByIdAndDelete(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

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

router.put('/:roleId/assign/:userId', protect, isAdmin, async (req, res) => {
  try {
    const role = await Role.findById(req.params.roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role: req.params.roleId },
      { new: true }
    ).populate('role');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      message: `Role '${role.name}' assigned to user successfully`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: {
            name: user.role.name,
            permissions: user.role.permissions,
          },
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
