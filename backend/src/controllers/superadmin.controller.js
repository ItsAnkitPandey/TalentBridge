const { User } = require('../models');
const { logger } = require('../middleware/errorHandler.middleware');
const { configDotenv } = require('dotenv');
configDotenv();
/**
 * Super Admin Controller
 * Handles admin management operations (only accessible by super admin)
 */

// Super admin email - the first admin who can manage other admins
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;

// Check if user is super admin
const isSuperAdmin = (user) => {
  return user.user_type === 'admin' && user.email === SUPER_ADMIN_EMAIL;
};

// @desc    Get all admins
// @route   GET /api/superadmin/admins
// @access  Private (Super Admin)
exports.getAllAdmins = async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admin can manage admins.'
      });
    }

    const admins = await User.findAll({
      where: { user_type: 'admin' },
      attributes: { exclude: ['password'] },
      order: [['created_at', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: { admins }
    });
  } catch (error) {
    logger.error('Get all admins error:', error);
    next(error);
  }
};

// @desc    Create new admin
// @route   POST /api/superadmin/admins
// @access  Private (Super Admin)
exports.createAdmin = async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admin can create admins.'
      });
    }

    const { email, password, first_name, last_name } = req.body;

    // Validate required fields
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, first name, and last name'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create admin user
    const admin = await User.create({
      email,
      password, // Will be hashed by the model's beforeCreate hook
      first_name,
      last_name,
      user_type: 'admin',
      is_verified: true,
      is_active: true,
      auth_provider: 'local'
    });

    // Remove password from response
    const adminResponse = admin.toJSON();
    delete adminResponse.password;

    logger.info(`Super admin ${req.user.email} created new admin: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: { admin: adminResponse }
    });
  } catch (error) {
    logger.error('Create admin error:', error);
    next(error);
  }
};

// @desc    Update admin status
// @route   PUT /api/superadmin/admins/:id
// @access  Private (Super Admin)
exports.updateAdminStatus = async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admin can manage admins.'
      });
    }

    const { id } = req.params;
    const { is_active } = req.body;

    // Prevent super admin from disabling themselves
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify your own admin status'
      });
    }

    const admin = await User.findByPk(id);
    if (!admin || admin.user_type !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent disabling the super admin
    if (admin.email === SUPER_ADMIN_EMAIL) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify super admin status'
      });
    }

    admin.is_active = is_active;
    await admin.save();

    logger.info(`Super admin ${req.user.email} updated admin ${admin.email} status to ${is_active}`);

    res.status(200).json({
      success: true,
      message: `Admin ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: { admin: admin.toJSON() }
    });
  } catch (error) {
    logger.error('Update admin status error:', error);
    next(error);
  }
};

// @desc    Delete admin
// @route   DELETE /api/superadmin/admins/:id
// @access  Private (Super Admin)
exports.deleteAdmin = async (req, res, next) => {
  try {
    logger.info(`Delete admin attempt by: ${req.user.email}, user_type: ${req.user.user_type}`);
    
    if (!isSuperAdmin(req.user)) {
      logger.warn(`Non-super admin tried to delete admin: ${req.user.email}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admin can delete admins.'
      });
    }

    const { id } = req.params;

    // Prevent super admin from deleting themselves (fix type comparison)
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own admin account'
      });
    }

    const admin = await User.findByPk(id);
    if (!admin || admin.user_type !== 'admin') {
      logger.warn(`Admin not found or not an admin: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent deleting the super admin
    if (admin.email === SUPER_ADMIN_EMAIL) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete super admin account'
      });
    }

    await admin.destroy();

    logger.info(`Super admin ${req.user.email} deleted admin: ${admin.email}`);

    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    logger.error('Delete admin error:', error);
    next(error);
  }
};

// @desc    Check if current user is super admin
// @route   GET /api/superadmin/check
// @access  Private
exports.checkSuperAdmin = async (req, res, next) => {
  try {
    const isSuper = isSuperAdmin(req.user);
    
    logger.info(`Super admin check: ${req.user.email}, is super: ${isSuper}, user_type: ${req.user.user_type}, expected: ${SUPER_ADMIN_EMAIL}`);
    
    res.status(200).json({
      success: true,
      data: { isSuperAdmin: isSuper }
    });
  } catch (error) {
    logger.error('Check super admin error:', error);
    next(error);
  }
};

module.exports = exports;
