/**
 * CSRF Protection Middleware - Production Grade
 * Implements Double Submit Cookie pattern for stateless CSRF protection
 * Compatible with JWT authentication
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

// Configuration
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET;

/**
 * Generate cryptographically secure CSRF token
 */
const generateCSRFToken = () => {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
};

/**
 * Create HMAC signature of token
 */
const signToken = (token) => {
  return crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(token)
    .digest('hex');
};

/**
 * Verify token signature
 */
const verifyToken = (token, signature) => {
  const expectedSignature = signToken(token);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

/**
 * Middleware to generate and set CSRF token
 * Apply this to routes that render forms or SPAs
 */
const setCSRFToken = (req, res, next) => {
  // Generate new token
  const token = generateCSRFToken();
  const signature = signToken(token);
  
  // Set cookie with token (HttpOnly for security)
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  // Send signature in response header for client to use
  res.setHeader(CSRF_HEADER_NAME, signature);
  
  // Also attach to request for use in templates
  req.csrfToken = () => signature;
  
  next();
};

/**
 * Middleware to validate CSRF token on state-changing requests
 * Apply this to POST, PUT, PATCH, DELETE routes
 */
const validateCSRFToken = (req, res, next) => {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Get token from cookie
  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  
  // Get signature from header
  const headerSignature = req.headers[CSRF_HEADER_NAME.toLowerCase()] || 
                          req.headers['x-csrf-token'] || 
                          req.body._csrf;
  
  // Validate presence
  if (!cookieToken || !headerSignature) {
    logger.warn('CSRF validation failed: Missing token or signature', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      hasCookie: !!cookieToken,
      hasHeader: !!headerSignature
    });
    
    return res.status(403).json({
      success: false,
      message: 'CSRF validation failed',
      code: 'CSRF_TOKEN_MISSING'
    });
  }
  
  // Verify token
  try {
    const isValid = verifyToken(cookieToken, headerSignature);
    
    if (!isValid) {
      logger.warn('CSRF validation failed: Invalid token', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({
        success: false,
        message: 'CSRF validation failed',
        code: 'CSRF_TOKEN_INVALID'
      });
    }
    
    // Token is valid
    next();
  } catch (error) {
    logger.error('CSRF validation error:', error);
    
    return res.status(403).json({
      success: false,
      message: 'CSRF validation failed',
      code: 'CSRF_VALIDATION_ERROR'
    });
  }
};

/**
 * Middleware to skip CSRF for specific routes (e.g., webhooks)
 */
const skipCSRF = (req, res, next) => {
  req.skipCSRF = true;
  next();
};

/**
 * Conditional CSRF middleware - only validate if not skipped
 */
const csrfProtection = (req, res, next) => {
  if (req.skipCSRF) {
    return next();
  }
  return validateCSRFToken(req, res, next);
};

module.exports = {
  setCSRFToken,
  validateCSRFToken,
  csrfProtection,
  skipCSRF,
  generateCSRFToken
};
