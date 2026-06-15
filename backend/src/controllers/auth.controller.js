const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');
const { sendWelcomeEmail } = require('../services/email.service');
const { sendEmailVerification } = require('../services/verification.service');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
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

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user (unverified by default)
    const user = await User.create({
      email,
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
        reasons: req.suspiciousReasons
      });
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    logger.info(`User registered successfully: ${email} (verification required)`);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      requiresVerification: true,
      data: {
        user,
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user with password
    const user = await User.findOne({
      where: { email },
      attributes: { include: ['password'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Remove password from response
    const userResponse = user.toJSON();

    logger.info(`User logged in successfully: ${email}`);

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

// @desc    Refresh token
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

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Generate new access token
    const token = generateToken(decoded.id);

    res.status(200).json({
      success: true,
      data: {
        token
      }
    });
  } catch (error) {
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

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  // In a stateless JWT setup, logout is handled client-side
  // You can implement token blacklisting here if needed
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
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
