const { Referral, User, Job, Organization } = require('../models');
const logger = require('../utils/logger');
const { sendReferralRequestEmail, sendReferralAcceptedEmail } = require('../services/email.service');

// @desc    Create referral request
// @route   POST /api/referrals/request
// @access  Private
exports.createReferralRequest = async (req, res, next) => {
  try {
    const { job_id, message, resume_url } = req.body;

    // Check if job exists
    const job = await Job.findByPk(job_id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Prevent users from requesting referrals for their own jobs
    if (job.posted_by && job.posted_by === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request a referral for a job you posted'
      });
    }

    // Check if user already requested referral for this job
    const existingRequest = await Referral.findOne({
      where: {
        requester_id: req.user.id,
        job_id
      }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You have already requested a referral for this job'
      });
    }

    const referral = await Referral.create({
      requester_id: req.user.id,
      job_id,
      message,
      resume_url,
      status: 'requested'
    });

    const fullReferral = await Referral.findByPk(referral.id, {
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'first_name', 'last_name', 'email', 'profile_picture']
        },
        {
          model: Job,
          as: 'job',
          include: [{ model: Organization, as: 'organization' }]
        }
      ]
    });

    // Find potential referrers from the job's organization
    const potentialReferrers = await User.findAll({
      where: {
        organization_id: job.organization_id,
        can_provide_referrals: true
      },
      limit: 5 // Notify up to 5 employees
    });

    // Send referral request emails to potential referrers (non-blocking)
    potentialReferrers.forEach(referrer => {
      sendReferralRequestEmail(referrer, req.user, fullReferral.job).catch(err => {
        logger.error(`Failed to send referral request email to ${referrer.email}:`, err);
      });
    });

    logger.info(`Referral request created: ${referral.id}`);

    res.status(201).json({
      success: true,
      message: 'Referral request created successfully',
      data: { referral: fullReferral }
    });
  } catch (error) {
    logger.error('Create referral request error:', error);
    next(error);
  }
};

// @desc    Get all referral requests (for referrers)
// @route   GET /api/referrals/requests
// @access  Private
exports.getReferralRequests = async (req, res, next) => {
  try {
    const { status = 'requested' } = req.query;

    // Get jobs from user's organization
    const referralRequests = await Referral.findAll({
      where: { status },
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'first_name', 'last_name', 'email', 'profile_picture', 'skills', 'years_of_experience']
        },
        {
          model: Job,
          as: 'job',
          where: { organization_id: req.user.organization_id },
          include: [{ model: Organization, as: 'organization' }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: { referrals: referralRequests }
    });
  } catch (error) {
    logger.error('Get referral requests error:', error);
    next(error);
  }
};

// @desc    Get user's referral requests
// @route   GET /api/referrals/my-requests
// @access  Private
exports.getMyReferralRequests = async (req, res, next) => {
  try {
    const referrals = await Referral.findAll({
      where: { requester_id: req.user.id },
      include: [
        {
          model: User,
          as: 'referrer',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture']
        },
        {
          model: Job,
          as: 'job',
          include: [{ model: Organization, as: 'organization' }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: { referrals }
    });
  } catch (error) {
    logger.error('Get my referral requests error:', error);
    next(error);
  }
};

// @desc    Get referrals provided by user
// @route   GET /api/referrals/provided
// @access  Private
exports.getProvidedReferrals = async (req, res, next) => {
  try {
    const referrals = await Referral.findAll({
      where: { referrer_id: req.user.id },
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'first_name', 'last_name', 'email', 'profile_picture']
        },
        {
          model: Job,
          as: 'job',
          include: [{ model: Organization, as: 'organization' }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: { referrals }
    });
  } catch (error) {
    logger.error('Get provided referrals error:', error);
    next(error);
  }
};

// @desc    Accept referral request
// @route   PUT /api/referrals/:id/accept
// @access  Private
exports.acceptReferralRequest = async (req, res, next) => {
  try {
    const { response_message, referrer_notes } = req.body;

    const referral = await Referral.findByPk(req.params.id);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral request not found'
      });
    }

    if (referral.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: 'This referral request has already been processed'
      });
    }

    // Update referral
    await referral.update({
      referrer_id: req.user.id,
      status: 'accepted',
      response_message,
      referrer_notes,
      accepted_at: new Date()
    });

    // Update user referral stats
    await req.user.update({
      referral_count: req.user.referral_count + 1
    });

    const updatedReferral = await Referral.findByPk(referral.id, {
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'first_name', 'last_name', 'email', 'profile_picture']
        },
        {
          model: User,
          as: 'referrer',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture']
        },
        {
          model: Job,
          as: 'job',
          include: [{ model: Organization, as: 'organization' }]
        }
      ]
    });

    // Send acceptance email to requester (non-blocking)
    sendReferralAcceptedEmail(
      updatedReferral.requester,
      updatedReferral.referrer,
      updatedReferral.job
    ).catch(err => {
      logger.error('Failed to send referral acceptance email:', err);
    });

    logger.info(`Referral accepted: ${referral.id} by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Referral request accepted',
      data: { referral: updatedReferral }
    });
  } catch (error) {
    logger.error('Accept referral error:', error);
    next(error);
  }
};

// @desc    Reject referral request
// @route   PUT /api/referrals/:id/reject
// @access  Private
exports.rejectReferralRequest = async (req, res, next) => {
  try {
    const { response_message } = req.body;

    const referral = await Referral.findByPk(req.params.id);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral request not found'
      });
    }

    if (referral.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: 'This referral request has already been processed'
      });
    }

    await referral.update({
      referrer_id: req.user.id,
      status: 'rejected',
      response_message
    });

    logger.info(`Referral rejected: ${referral.id} by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Referral request rejected'
    });
  } catch (error) {
    logger.error('Reject referral error:', error);
    next(error);
  }
};

// @desc    Mark referral as completed
// @route   PUT /api/referrals/:id/complete
// @access  Private
exports.completeReferral = async (req, res, next) => {
  try {
    const referral = await Referral.findByPk(req.params.id);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    if (referral.referrer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await referral.update({
      status: 'completed',
      completed_at: new Date()
    });

    // Update successful referral count
    await req.user.update({
      successful_referral_count: req.user.successful_referral_count + 1
    });

    logger.info(`Referral completed: ${referral.id}`);

    res.status(200).json({
      success: true,
      message: 'Referral marked as completed'
    });
  } catch (error) {
    logger.error('Complete referral error:', error);
    next(error);
  }
};
