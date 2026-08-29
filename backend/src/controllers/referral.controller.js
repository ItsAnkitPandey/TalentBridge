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
    const { response_message, referrer_notes, internal_referral_id, proof_url, proof_notes } = req.body;

    const referral = await Referral.findByPk(req.params.id, {
      include: [{ model: Job, as: 'job' }]
    });

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

    // Verify referrer belongs to the job's organization
    if (!req.user.organization_id || req.user.organization_id !== referral.job.organization_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only accept referral requests for jobs in your organization'
      });
    }

    const hasProof = internal_referral_id || proof_url || proof_notes;
    const newStatus = hasProof ? 'submitted_to_hr' : 'accepted';

    // Update referral
    await referral.update({
      referrer_id: req.user.id,
      status: newStatus,
      response_message,
      referrer_notes,
      internal_referral_id: internal_referral_id || null,
      proof_url: proof_url || null,
      proof_notes: proof_notes || null,
      accepted_at: new Date(),
      submitted_at: hasProof ? new Date() : null
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

    const referral = await Referral.findByPk(req.params.id, {
      include: [{ model: Job, as: 'job' }]
    });

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

    // Verify referrer belongs to the job's organization
    if (!req.user.organization_id || req.user.organization_id !== referral.job.organization_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only reject referral requests for jobs in your organization'
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

// @desc    Submit HR Referral Proof (Workday/Portal Referral ID or proof link)
// @route   PUT /api/referrals/:id/submit-hr
// @access  Private
exports.submitReferralToHr = async (req, res, next) => {
  try {
    const { internal_referral_id, proof_url, proof_notes } = req.body;

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
        message: 'Not authorized to submit proof for this referral'
      });
    }

    await referral.update({
      status: 'submitted_to_hr',
      internal_referral_id: internal_referral_id || referral.internal_referral_id,
      proof_url: proof_url || referral.proof_url,
      proof_notes: proof_notes || referral.proof_notes,
      submitted_at: new Date()
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

    logger.info(`Referral submitted to HR: ${referral.id}`);

    res.status(200).json({
      success: true,
      message: 'Referral proof submitted successfully',
      data: { referral: updatedReferral }
    });
  } catch (error) {
    logger.error('Submit referral to HR error:', error);
    next(error);
  }
};

// @desc    Update referral status milestone (interviewing, completed, rejected, etc.)
// @route   PUT /api/referrals/:id/status
// @access  Private
exports.updateReferralStatus = async (req, res, next) => {
  try {
    const { status, response_message } = req.body;
    const validStatuses = ['accepted', 'submitted_to_hr', 'interviewing', 'completed', 'rejected', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const referral = await Referral.findByPk(req.params.id);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    if (referral.referrer_id !== req.user.id && referral.requester_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this referral status'
      });
    }

    const previousStatus = referral.status;
    const updates = { status };

    if (response_message) {
      updates.response_message = response_message;
    }

    if (status === 'completed' && previousStatus !== 'completed') {
      updates.completed_at = new Date();
      // Increase referrer's successful count if set by referrer
      if (referral.referrer_id) {
        const referrer = await User.findByPk(referral.referrer_id);
        if (referrer) {
          await referrer.update({
            successful_referral_count: referrer.successful_referral_count + 1
          });
        }
      }
    }

    await referral.update(updates);

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

    logger.info(`Referral status updated to ${status}: ${referral.id}`);

    res.status(200).json({
      success: true,
      message: `Referral status updated to ${status}`,
      data: { referral: updatedReferral }
    });
  } catch (error) {
    logger.error('Update referral status error:', error);
    next(error);
  }
};
