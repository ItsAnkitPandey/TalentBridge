const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');
const { sendWelcomeEmail } = require('../services/email.service');
const { sendEmailVerification } = require('../services/verification.service');
const { 
  recordFailedAttempt, 
  clearFailedAttempts 
} = require('../middleware/account-lockout.middleware');
const { 
  blacklistToken, 
  isTokenBlacklisted,
  blacklistUserTokens 
} = require('../utils/token-blacklist');
const { 
  validateEmail, 
  validatePassword 
} = require('../utils/security-validator');

// Generate JWT Token with enhanced security
const generateToken = (userId, additionalClaims = {}) => {
  const payload = {
    id: userId,
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
    ...additionalClaims
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
    issuer: 'talentbridge-api',
    audience: 'talentbridge-client'
  });
};

// Generate Refresh Token with enhanced security
const generateRefreshToken = (userId) => {
  const payload = {
    id: userId,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
    issuer: 'talentbridge-api',
    audience: 'talentbridge-client'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      user_type,
      organization_id,
      job_title,
      years_of_experience,
      linkedin_url
    } = req.body;

    // Enhanced email validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.error,
        field: 'email'
      });
    }

    // Enhanced password validation (already done in middleware, but double-check)
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
        suggestions: passwordValidation.suggestions,
        field: 'password'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      where: { email: emailValidation.email } 
    });
    
    if (existingUser) {
      // Don't reveal if email exists (security best practice)
      logger.warn('Registration attempt with existing email', { 
        email: emailValidation.email,
        ip: req.ip 
      });
      
      return res.status(400).json({
        success: false,
        message: 'If this email is not already registered, you will receive a verification email shortly.'
      });
    }

    // Create user (unverified by default)
    const user = await User.create({
      email: emailValidation.email,
      password,
      first_name,
      last_name,
      user_type: user_type || 'employee',
      organization_id,
      job_title,
      years_of_experience: years_of_experience || 0,
      linkedin_url,
      auth_provider: 'local',
      is_verified: false // Require email verification
    });

    // Send verification email (non-blocking)
    sendEmailVerification(user).catch(err => {
      logger.error('Failed to send verification email:', err);
    });

    // Log if suspicious registration was detected
    if (req.suspiciousRegistration) {
      logger.warn('Suspicious registration flagged:', {
        user_id: user.id,
        email: user.email,
        ip: req.ip,
        reasons: req.suspiciousReasons
      });
    }

    // Generate tokens with enhanced claims
    const token = generateToken(user.id, { 
      verified: false,
      user_type: user.user_type 
    });
    const refreshToken = generateRefreshToken(user.id);

    logger.info(`User registered successfully: ${emailValidation.email} (verification required)`, {
      user_id: user.id,
      ip: req.ip,
      user_agent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      requiresVerification: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          user_type: user.user_type,
          is_verified: user.is_verified
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

// @desc    Login user with enhanced security
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const clientIP = req.ip;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const emailLower = email.toLowerCase().trim();

    // Find user with password
    const user = await User.findOne({
      where: { email: emailLower },
      attributes: { include: ['password'] }
    });

    // Generic error message to prevent user enumeration
    const invalidCredentialsResponse = {
      success: false,
      message: 'Invalid credentials'
    };

    if (!user) {
      // Record failed attempt even if user doesn't exist (prevents enumeration)
      recordFailedAttempt(emailLower, clientIP);
      
      logger.warn('Login attempt for non-existent user', { 
        email: emailLower, 
        ip: clientIP 
      });
      
      return res.status(401).json(invalidCredentialsResponse);
    }

    // Check if account is active
    if (!user.is_active) {
      logger.warn('Login attempt for inactive account', { 
        email: emailLower, 
        user_id: user.id,
        ip: clientIP 
      });
      
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Record failed attempt
      const isLocked = recordFailedAttempt(emailLower, clientIP);
      
      logger.warn('Failed login attempt - invalid password', { 
        email: emailLower,
        user_id: user.id,
        ip: clientIP,
        accountLocked: isLocked
      });
      
      return res.status(401).json(invalidCredentialsResponse);
    }

    // Check if email is verified (optional - based on your requirements)
    if (!user.is_verified && user.auth_provider === 'local') {
      logger.warn('Login attempt with unverified email', { 
        email: emailLower,
        user_id: user.id 
      });
      
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        code: 'EMAIL_NOT_VERIFIED',
        requiresVerification: true
      });
    }

    // Successful login - clear any failed attempts
    clearFailedAttempts(emailLower);

    // Update last login with additional metadata
    user.last_login = new Date();
    await user.save();

    // Generate tokens with enhanced claims
    const token = generateToken(user.id, { 
      verified: user.is_verified,
      user_type: user.user_type,
      can_provide_referrals: user.can_provide_referrals
    });
    const refreshToken = generateRefreshToken(user.id);

    // Prepare safe user response (exclude sensitive fields)
    const userResponse = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      profile_picture: user.profile_picture,
      user_type: user.user_type,
      organization_id: user.organization_id,
      job_title: user.job_title,
      is_verified: user.is_verified,
      can_provide_referrals: user.can_provide_referrals,
      last_login: user.last_login
    };

    logger.info(`User logged in successfully`, {
      email: emailLower,
      user_id: user.id,
      ip: clientIP,
      user_agent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = async (req, res) => {
  try {
    const user = req.user;
    const isNewUser = user.isNewUser;

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Send welcome email for new users (non-blocking)
    if (isNewUser) {
      sendWelcomeEmail(user).catch(err => {
        logger.error('Failed to send welcome email:', err);
      });
      logger.info(`New user registered via Google OAuth: ${user.email}`);
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
  } catch (error) {
    logger.error('Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
  }
};

// @desc    LinkedIn OAuth callback
// @route   GET /api/auth/linkedin/callback
// @access  Public
exports.linkedinCallback = async (req, res) => {
  try {
    const user = req.user;
    const isNewUser = user.isNewUser;

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Send welcome email for new users (non-blocking)
    if (isNewUser) {
      sendWelcomeEmail(user).catch(err => {
        logger.error('Failed to send welcome email:', err);
      });
      logger.info(`New user registered via LinkedIn OAuth: ${user.email}`);
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
  } catch (error) {
    logger.error('LinkedIn OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
  }
};

// @desc    Refresh token with enhanced security
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(refreshToken)) {
      logger.warn('Attempt to use blacklisted refresh token', { 
        ip: req.ip 
      });
      
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, {
      issuer: 'talentbridge-api',
      audience: 'talentbridge-client'
    });

    // Validate token type
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Fetch user to get current state
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'is_active', 'is_verified', 'user_type', 'can_provide_referrals']
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Generate new access token with current user state
    const token = generateToken(user.id, {
      verified: user.is_verified,
      user_type: user.user_type,
      can_provide_referrals: user.can_provide_referrals
    });

    logger.info('Token refreshed successfully', { 
      user_id: user.id,
      ip: req.ip 
    });

    res.status(200).json({
      success: true,
      data: {
        token
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid refresh token attempt', { 
        ip: req.ip,
        error: error.message 
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    logger.error('Token refresh error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
};

// @desc    Logout user with token blacklisting
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Blacklist the token
      blacklistToken(token);
      
      logger.info('User logged out', { 
        user_id: req.user.id,
        email: req.user.email,
        ip: req.ip 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { verifyEmailToken } = require('../services/verification.service');

    const result = await verifyEmailToken(token);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Send welcome email after verification
    sendWelcomeEmail(result.user).catch(err => {
      logger.error('Failed to send welcome email:', err);
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      data: {
        user: result.user
      }
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const { resendVerification } = require('../services/verification.service');
    const result = await resendVerification(email);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    logger.error('Resend verification error:', error);
    next(error);
  }
};
