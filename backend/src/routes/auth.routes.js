const express = require('express');const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateRegister, validateLogin } = require('../middleware/validation.middleware');
const { 
  validateEmailDomainMiddleware, 
  detectSuspiciousUser 
} = require('../middleware/verification.middleware');

// Local auth routes
router.post(
  '/register', 
  validateRegister, 
  validateEmailDomainMiddleware, 
  detectSuspiciousUser, 
  authController.register
);
router.post('/login', validateLogin, authController.login);
router.post('/refresh', authController.refreshToken);
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);

// Email verification routes
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// OAuth routes - DISABLED (will be re-enabled later)
// Google OAuth routes
// router.get(
//   '/google',
//   passport.authenticate('google', { scope: ['profile', 'email'] })
// );

// router.get(
//   '/google/callback',
//   passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login` }),
//   authController.googleCallback
// );

// LinkedIn OAuth routes
// router.get(
//   '/linkedin',
//   passport.authenticate('linkedin', { scope: ['r_emailaddress', 'r_liteprofile'] })
// );

// router.get(
//   '/linkedin/callback',
//   passport.authenticate('linkedin', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login` }),
//   authController.linkedinCallback
// );

module.exports = router;
