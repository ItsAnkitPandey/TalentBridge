const { logger } = require('./errorHandler.middleware');

/**
 * Admin Authorization Middleware
 * Verifies that the authenticated user has admin privileges
 */
exports.isAdmin = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user is admin
    if (req.user.user_type !== 'admin') {
      logger.warn(`Unauthorized admin access attempt by user: ${req.user.id}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    logger.info(`Admin access granted: ${req.user.email}`);
    next();
  } catch (error) {
    logger.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
