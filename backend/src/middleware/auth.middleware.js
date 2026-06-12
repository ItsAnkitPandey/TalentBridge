const passport = require('passport');

// Protect routes - JWT authentication
exports.protect = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
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
