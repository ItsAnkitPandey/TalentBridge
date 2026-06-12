const { User, Organization } = require('../models');
const { validateEmailDomain, detectSuspiciousRegistration } = require('../utils/security');
const logger = require('../utils/logger');

/**
 * Middleware to ensure user is email verified
 */
exports.requireEmailVerification = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user is verified
    if (!req.user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required. Please check your email for verification link.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    next();
  } catch (error) {
    logger.error('Email verification check error:', error);
    next(error);
  }
};

/**
 * Middleware to validate email domain for registration
 */
exports.validateEmailDomainMiddleware = async (req, res, next) => {
  try {
    const { email, organization_id } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email domain
    const validation = validateEmailDomain(email);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.reason
      });
    }

    // Check if user selected employee type with organization
    if (organization_id && req.body.user_type === 'employee') {
      const organization = await Organization.findByPk(organization_id);

      if (!organization) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }

      // If organization has specific email domains, validate
      if (organization.email_domains && organization.email_domains.length > 0) {
        const emailDomain = validation.domain;
        const isAllowedDomain = organization.email_domains.some(domain => 
          emailDomain === domain || emailDomain.endsWith('.' + domain)
        );

        if (!isAllowedDomain) {
          return res.status(400).json({
            success: false,
            message: `Email domain must be from ${organization.name}. Allowed domains: ${organization.email_domains.join(', ')}`,
            code: 'INVALID_EMAIL_DOMAIN'
          });
        }
      }

      // Warn if personal email used for corporate registration
      if (!validation.isCorporate && !organization.email_domains?.length) {
        req.personalEmailWarning = true;
        logger.warn(`Personal email used for corporate registration: ${email} for ${organization.name}`);
      }
    }

    next();
  } catch (error) {
    logger.error('Email domain validation error:', error);
    next(error);
  }
};

/**
 * Middleware to detect suspicious registration patterns
 */
exports.detectSuspiciousUser = async (req, res, next) => {
  try {
    const detection = detectSuspiciousRegistration(req.body);

    if (detection.isSuspicious) {
      logger.warn('Suspicious registration attempt:', {
        email: req.body.email,
        reasons: detection.reasons
      });

      // Flag for admin review instead of blocking
      req.suspiciousRegistration = true;
      req.suspiciousReasons = detection.reasons;
    }

    next();
  } catch (error) {
    logger.error('Suspicious user detection error:', error);
    next(error);
  }
};

/**
 * Middleware to check if user can post jobs
 */
exports.canPostJobs = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Must be verified
    if (!req.user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required to post jobs',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Must be employee type
    if (req.user.user_type === 'fresher') {
      return res.status(403).json({
        success: false,
        message: 'Only employees can post jobs',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Must have organization
    if (!req.user.organization_id) {
      return res.status(403).json({
        success: false,
        message: 'You must be associated with an organization to post jobs',
        code: 'NO_ORGANIZATION'
      });
    }

    // Check organization verification
    const organization = await Organization.findByPk(req.user.organization_id);
    if (!organization || !organization.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Your organization must be verified to post jobs. Contact admin.',
        code: 'ORGANIZATION_NOT_VERIFIED'
      });
    }

    next();
  } catch (error) {
    logger.error('Job posting permission check error:', error);
    next(error);
  }
};

/**
 * Middleware to rate limit job postings
 */
exports.rateLimitJobPosting = async (req, res, next) => {
  try {
    const { Job } = require('../models');
    const { Op } = require('sequelize');

    // Check jobs posted in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentJobsCount = await Job.count({
      where: {
        posted_by: req.user.id,
        created_at: {
          [Op.gte]: oneDayAgo
        }
      }
    });

    // Limit: 10 jobs per day for regular users, unlimited for admins
    const dailyLimit = req.user.user_type === 'admin' ? Infinity : 10;

    if (recentJobsCount >= dailyLimit) {
      return res.status(429).json({
        success: false,
        message: `You have reached the daily limit of ${dailyLimit} job posts. Please try again tomorrow.`,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    next();
  } catch (error) {
    logger.error('Job posting rate limit error:', error);
    next(error);
  }
};

/**
 * Middleware to rate limit referral requests
 */
exports.rateLimitReferralRequests = async (req, res, next) => {
  try {
    const { Referral } = require('../models');
    const { Op } = require('sequelize');

    // Check referrals requested in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const recentRequestsCount = await Referral.count({
      where: {
        requester_id: req.user.id,
        created_at: {
          [Op.gte]: oneHourAgo
        }
      }
    });

    // Limit: 5 referral requests per hour
    const hourlyLimit = 5;

    if (recentRequestsCount >= hourlyLimit) {
      return res.status(429).json({
        success: false,
        message: `You have reached the hourly limit of ${hourlyLimit} referral requests. Please try again later.`,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    next();
  } catch (error) {
    logger.error('Referral request rate limit error:', error);
    next(error);
  }
};
