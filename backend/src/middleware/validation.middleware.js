const { body, validationResult } = require('express-validator');
const { 
  validateEmail, 
  validatePassword,
  validateName,
  sanitizeHTML 
} = require('../utils/security-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Register validation - PRODUCTION READY
exports.validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:,.<>])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .trim()
    .escape(),
  body('last_name')
    .notEmpty()
    .withMessage('Last name is required')
    .trim()
    .escape(),
  body('user_type')
    .optional()
    .isIn(['employee', 'fresher', 'admin'])
    .withMessage('Invalid user type'),
  body('years_of_experience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Years of experience must be a whole number between 0 and 50')
    .toInt(),
  body('job_title')
    .optional()
    .trim()
    .escape(),
  body('organization_id')
    .optional()
    .isUUID()
    .withMessage('Invalid organization ID'),
  handleValidationErrors
];

// Login validation
exports.validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// Job validation
exports.validateJob = [
  body('title').notEmpty().withMessage('Job title is required'),
  body('description').notEmpty().withMessage('Job description is required'),
  body('organization_id').notEmpty().withMessage('Organization ID is required'),
  body('experience_level')
    .isIn(['entry', 'mid', 'senior', 'lead', 'fresher'])
    .withMessage('Invalid experience level'),
  body('location').notEmpty().withMessage('Location is required'),
  handleValidationErrors
];

// Referral request validation
exports.validateReferralRequest = [
  body('job_id').notEmpty().withMessage('Job ID is required'),
  body('message').optional().isString(),
  handleValidationErrors
];
