const { body, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Register validation
exports.validateRegister = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('user_type')
    .optional()
    .isIn(['employee', 'fresher', 'admin'])
    .withMessage('Invalid user type'),
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
