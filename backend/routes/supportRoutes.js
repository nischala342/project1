const express = require('express');
const router = express.Router();
const SupportRequest = require('../models/SupportRequest');
const { protect } = require('../middleware/auth');
const { checkPermission, isAdmin } = require('../middleware/rbac');

router.get('/', protect, checkPermission('read'), async (req, res) => {
  try {
    let query = {};
    
    const user = await require('../models/User').findById(req.user._id).populate('role');
    if (!user.role || user.role.name !== 'admin') {
      query.user = req.user._id;
    }

    const requests = await SupportRequest.find(query)
      .populate('user', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      data: requests,
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
    let query = { _id: req.params.id };
    
    const user = await require('../models/User').findById(req.user._id).populate('role');
    if (!user.role || user.role.name !== 'admin') {
      query.user = req.user._id;
    }

    const request = await SupportRequest.findOne(query)
      .populate('user', 'name email')
      .populate('resolvedBy', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Support request not found',
      });
    }

    res.json({
      success: true,
      data: request,
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
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide subject and message',
      });
    }

    const supportRequest = await SupportRequest.create({
      user: req.user._id,
      subject,
      message,
    });

    await supportRequest.populate('user', 'name email');

    res.status(201).json({
      success: true,
      data: supportRequest,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

router.put('/:id/resolve', protect, isAdmin, async (req, res) => {
  try {
    const { adminResponse } = req.body;

    const supportRequest = await SupportRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        adminResponse: adminResponse || 'Request resolved by admin',
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
      },
      { new: true }
    )
      .populate('user', 'name email')
      .populate('resolvedBy', 'name email');

    if (!supportRequest) {
      return res.status(404).json({
        success: false,
        error: 'Support request not found',
      });
    }

    res.json({
      success: true,
      data: supportRequest,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

router.put('/:id/reject', protect, isAdmin, async (req, res) => {
  try {
    const { adminResponse } = req.body;

    const supportRequest = await SupportRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        adminResponse: adminResponse || 'Request rejected by admin',
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
      },
      { new: true }
    )
      .populate('user', 'name email')
      .populate('resolvedBy', 'name email');

    if (!supportRequest) {
      return res.status(404).json({
        success: false,
        error: 'Support request not found',
      });
    }

    res.json({
      success: true,
      data: supportRequest,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    const user = await require('../models/User').findById(req.user._id).populate('role');
    if (!user.role || user.role.name !== 'admin') {
      query.user = req.user._id;
    }

    const supportRequest = await SupportRequest.findOneAndDelete(query);

    if (!supportRequest) {
      return res.status(404).json({
        success: false,
        error: 'Support request not found',
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

module.exports = router;
