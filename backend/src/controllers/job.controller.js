const { Job, Organization, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { sendJobApprovalNotification } = require('../services/email.service');

// @desc    Get all jobs with filters
// @route   GET /api/jobs
// @access  Public
exports.getAllJobs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      organization,
      location,
      experienceLevel,
      jobType,
      remoteType,
      skills
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { 
      is_active: true,
      is_approved: true // Only show approved jobs to public
    };

    // Apply filters
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { external_job_id: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (location) {
      where.location = { [Op.iLike]: `%${location}%` };
    }

    if (experienceLevel) {
      where.experience_level = experienceLevel;
    }

    if (jobType) {
      where.job_type = jobType;
    }

    if (remoteType) {
      where.remote_type = remoteType;
    }

    if (skills) {
      const skillArray = skills.split(',');
      where.required_skills = { [Op.overlap]: skillArray };
    }

    const { count, rows: jobs } = await Job.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'logo', 'industry']
        },
        {
          model: User,
          as: 'poster',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        jobs,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get jobs error:', error);
    next(error);
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
exports.getJob = async (req, res, next) => {
  try {
    const job = await Job.findByPk(req.params.id, {
      include: [
        {
          model: Organization,
          as: 'organization'
        },
        {
          model: User,
          as: 'poster',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture', 'job_title']
        }
      ]
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if job is approved (unless user is admin or job poster)
    const isAdmin = req.user?.user_type === 'admin';
    const isPoster = req.user?.id === job.posted_by;
    
    if (!job.is_approved && !isAdmin && !isPoster) {
      return res.status(403).json({
        success: false,
        message: 'This job is pending approval'
      });
    }

    // Increment view count
    job.views_count += 1;
    await job.save();

    res.status(200).json({
      success: true,
      data: { job }
    });
  } catch (error) {
    logger.error('Get job error:', error);
    next(error);
  }
};

// @desc    Create job
// @route   POST /api/jobs
// @access  Private
exports.createJob = async (req, res, next) => {
  try {
    // Auto-approve jobs posted by admins
    const isAdmin = req.user.user_type === 'admin';
    
    const jobData = {
      ...req.body,
      posted_by: req.user.id,
      source: 'manual',
      is_approved: isAdmin, // Auto-approve for admins, require approval for others
      ...(isAdmin && {
        approved_by: req.user.id,
        approved_at: new Date()
      })
    };

    const job = await Job.create(jobData);

    const fullJob = await Job.findByPk(job.id, {
      include: [
        {
          model: Organization,
          as: 'organization'
        },
        {
          model: User,
          as: 'poster',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture', 'email']
        }
      ]
    });

    logger.info(`Job created: ${job.id} by user ${req.user.id} (admin: ${isAdmin})`);

    // Send email notification to all admins ONLY if posted by non-admin (non-blocking)
    if (!isAdmin) {
      User.findAll({
        where: { user_type: 'admin', is_active: true },
        attributes: ['email']
      }).then(admins => {
        const adminEmails = admins.map(admin => admin.email);
        if (adminEmails.length > 0) {
          sendJobApprovalNotification(fullJob, fullJob.poster, adminEmails).catch(err => {
            logger.error('Failed to send job approval notification:', err);
          });
        } else {
          logger.warn('No active admins found to notify about job approval');
        }
      }).catch(err => {
        logger.error('Failed to fetch admins for job notification:', err);
      });
    }

    res.status(201).json({
      success: true,
      message: isAdmin 
        ? 'Job posted successfully and is now live!' 
        : 'Job posted successfully! It will be visible after admin approval.',
      requiresApproval: !isAdmin,
      data: { job: fullJob }
    });
  } catch (error) {
    logger.error('Create job error:', error);
    next(error);
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private
exports.updateJob = async (req, res, next) => {
  try {
    const job = await Job.findByPk(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user owns the job or is admin
    if (job.posted_by !== req.user.id && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    await job.update(req.body);

    const updatedJob = await Job.findByPk(job.id, {
      include: [
        {
          model: Organization,
          as: 'organization'
        },
        {
          model: User,
          as: 'poster',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture']
        }
      ]
    });

    logger.info(`Job updated: ${job.id}`);

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: { job: updatedJob }
    });
  } catch (error) {
    logger.error('Update job error:', error);
    next(error);
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findByPk(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user owns the job or is admin
    if (job.posted_by !== req.user.id && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
    }

    // Soft delete by setting is_active to false
    await job.update({ is_active: false });

    logger.info(`Job deleted: ${job.id}`);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    logger.error('Delete job error:', error);
    next(error);
  }
};

// @desc    Get jobs by organization
// @route   GET /api/jobs/organization/:orgId
// @access  Public
exports.getJobsByOrganization = async (req, res, next) => {
  try {
    const jobs = await Job.findAll({
      where: {
        organization_id: req.params.orgId,
        is_active: true
      },
      include: [
        {
          model: Organization,
          as: 'organization'
        },
        {
          model: User,
          as: 'poster',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: { jobs }
    });
  } catch (error) {
    logger.error('Get jobs by organization error:', error);
    next(error);
  }
};
