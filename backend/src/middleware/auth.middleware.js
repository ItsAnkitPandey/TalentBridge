const passport = require('passport');
const { isTokenBlacklisted, isUserTokenRevoked } = require('../utils/token-blacklist');
const logger = require('../utils/logger');

// Protect routes - JWT authentication with token blacklist checking
exports.protect = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      logger.error('Authentication error:', err);
      return next(err);
    }

    if (!user) {
      logger.warn('Authentication failed - no user', { 
        ip: req.ip,
        path: req.path,
        info: info?.message 
      });
      
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        code: 'UNAUTHORIZED'
      });
    }

    // Extract token from header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check if token is blacklisted
      if (isTokenBlacklisted(token)) {
        logger.warn('Blacklisted token used', { 
          user_id: user.id,
          ip: req.ip 
        });
        
        return res.status(401).json({
          success: false,
          message: 'Token has been revoked. Please login again.',
          code: 'TOKEN_REVOKED'
        });
      }
      
      // Check if user's tokens were globally revoked (e.g., password change)
      const tokenPayload = req.user; // From passport JWT strategy
      if (tokenPayload && tokenPayload.iat) {
        if (isUserTokenRevoked(user.id, tokenPayload.iat)) {
          logger.warn('User tokens revoked - old token used', { 
            user_id: user.id,
            ip: req.ip 
          });
          
          return res.status(401).json({
            success: false,
            message: 'Session expired. Please login again.',
            code: 'SESSION_REVOKED'
          });
        }
      }
    }

    // Check if user account is active
    if (!user.is_active) {
      logger.warn('Inactive account access attempt', { 
        user_id: user.id,
        ip: req.ip 
      });
      
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Check if user is admin
exports.admin = (req, res, next) => {
  if (req.user && req.user.user_type === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required'
    });
  }
};

// Check if user can provide referrals
exports.canProvideReferrals = (req, res, next) => {
  if (req.user && req.user.can_provide_referrals) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to provide referrals'
    });
  }
};
