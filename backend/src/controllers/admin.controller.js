const { User, Job, Referral, Organization } = require('../models');
const { Op } = require('sequelize');
const { logger } = require('../middleware/errorHandler.middleware');
const { sendBulkEmail, sendJobApprovedEmail, sendJobRejectedEmail } = require('../services/email.service');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get total counts
    const totalUsers = await User.count();
    const totalJobs = await Job.count();
    const totalReferrals = await Referral.count();
    
    // Get active referrals (requested or accepted)
    const activeReferrals = await Referral.count({
      where: {
        status: {
          [Op.in]: ['requested', 'accepted']
        }
      }
    });

    // Calculate success rate
    const completedReferrals = await Referral.count({
      where: { status: 'completed' }
    });
    const successRate = totalReferrals > 0 
      ? ((completedReferrals / totalReferrals) * 100).toFixed(1)
      : 0;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsersThisMonth = await User.count({
      where: {
        created_at: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    const newJobsThisMonth = await Job.count({
      where: {
        created_at: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    const stats = {
      totalUsers,
      totalJobs,
      totalReferrals,
      activeReferrals,
      successRate: parseFloat(successRate),
      completedReferrals,
      newUsersThisMonth,
      newJobsThisMonth
    };

    logger.info('Admin dashboard stats retrieved');

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    next(error);
  }
};

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', user_type = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (user_type) {
      whereClause.user_type = user_type;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name']
        }
      ],
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });

    // Get referral counts for each user
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const referralCount = await Referral.count({
          where: { requester_id: user.id }
        });
        
        return {
          ...user.toJSON(),
          referralCount
        };
      })
    );

    logger.info(`Admin retrieved ${users.length} users`);

    res.status(200).json({
      success: true,
      data: {
        users: usersWithCounts,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Prevent deleting other admins
    if (user.user_type === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin accounts'
      });
    }

    await user.destroy();

    logger.info(`Admin deleted user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    next(error);
  }
};

// @desc    Get all jobs with pagination
// @route   GET /api/admin/jobs
// @access  Private (Admin)
exports.getAllJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', is_active = '', is_approved = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (is_active !== '') {
      whereClause.is_active = is_active === 'true';
    }

    if (is_approved !== '') {
      whereClause.is_approved = is_approved === 'true';
    }

    const { count, rows: jobs } = await Job.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'logo']
        },
        {
          model: User,
          as: 'poster',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Get application counts for each job
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const applicationsCount = await Referral.count({
          where: { job_id: job.id }
        });
        
        return {
          ...job.toJSON(),
          applicationsCount
        };
      })
    );

    logger.info(`Admin retrieved ${jobs.length} jobs`);

    res.status(200).json({
      success: true,
      data: {
        jobs: jobsWithCounts,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get all jobs error:', error);
    next(error);
  }
};

// @desc    Toggle job status (activate/deactivate)
// @route   PUT /api/admin/jobs/:id/toggle
// @access  Private (Admin)
exports.toggleJobStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    job.is_active = !job.is_active;
    await job.save();

    logger.info(`Admin toggled job status: ${job.id} to ${job.is_active}`);

    res.status(200).json({
      success: true,
      message: `Job ${job.is_active ? 'activated' : 'deactivated'} successfully`,
      data: { job }
    });
  } catch (error) {
    logger.error('Toggle job status error:', error);
    next(error);
  }
};

// @desc    Delete job
// @route   DELETE /api/admin/jobs/:id
// @access  Private (Admin)
exports.deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    await job.destroy();

    logger.info(`Admin deleted job: ${job.id}`);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    logger.error('Delete job error:', error);
    next(error);
  }
};

// @desc    Approve job
// @route   PUT /api/admin/jobs/:id/approve
// @access  Private (Admin)
exports.approveJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(id, {
      include: [
        {
          model: Organization,
          as: 'organization'
        },
        {
          model: User,
          as: 'poster',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.is_approved) {
      return res.status(400).json({
        success: false,
        message: 'Job is already approved'
      });
    }

    job.is_approved = true;
    job.approved_by = req.user.id;
    job.approved_at = new Date();
    job.rejection_reason = null;
    await job.save();

    // Send notification email to job poster (non-blocking)
    sendJobApprovedEmail(job, job.poster).catch(err => {
      logger.error('Failed to send job approved email:', err);
    });

    logger.info(`Admin approved job: ${job.id} - ${job.title}`);

    res.status(200).json({
      success: true,
      message: 'Job approved successfully',
      data: { job }
    });
  } catch (error) {
    logger.error('Approve job error:', error);
    next(error);
  }
};

// @desc    Reject job
// @route   PUT /api/admin/jobs/:id/reject
// @access  Private (Admin)
exports.rejectJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const job = await Job.findByPk(id, {
      include: [
        {
          model: Organization,
          as: 'organization'
        },
        {
          model: User,
          as: 'poster',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    job.is_approved = false;
    job.approved_by = null;
    job.approved_at = null;
    job.rejection_reason = reason;
    job.is_active = false; // Deactivate rejected jobs
    await job.save();

    // Send notification email to job poster with rejection reason (non-blocking)
    sendJobRejectedEmail(job, job.poster, reason).catch(err => {
      logger.error('Failed to send job rejected email:', err);
    });

    logger.info(`Admin rejected job: ${job.id} - ${job.title}. Reason: ${reason}`);

    res.status(200).json({
      success: true,
      message: 'Job rejected successfully',
      data: { job }
    });
  } catch (error) {
    logger.error('Reject job error:', error);
    next(error);
  }
};

// @desc    Get pending jobs count
// @route   GET /api/admin/jobs/pending/count
// @access  Private (Admin)
exports.getPendingJobsCount = async (req, res, next) => {
  try {
    const count = await Job.count({
      where: {
        is_approved: false,
        is_active: true
      }
    });

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    logger.error('Get pending jobs count error:', error);
    next(error);
  }
};

// @desc    Get all referrals with pagination
// @route   GET /api/admin/referrals
// @access  Private (Admin)
exports.getAllReferrals = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: referrals } = await Referral.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'referrer',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Job,
          as: 'job',
          include: [
            {
              model: Organization,
              as: 'organization',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    logger.info(`Admin retrieved ${referrals.length} referrals`);

    res.status(200).json({
      success: true,
      data: {
        referrals,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get all referrals error:', error);
    next(error);
  }
};

// @desc    Send bulk email
// @route   POST /api/admin/email/bulk
// @access  Private (Admin)
exports.sendBulkEmailToUsers = async (req, res, next) => {
  try {
    const { recipients, subject, message } = req.body;

    // Validate input
    if (!recipients || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Recipients, subject, and message are required'
      });
    }

    // Get users based on recipient filter
    let whereClause = {};
    
    if (recipients === 'employees') {
      whereClause.user_type = 'employee';
    } else if (recipients === 'freshers') {
      whereClause.user_type = 'fresher';
    } else if (recipients === 'active') {
      // Users who logged in within last 30 days (you may need to add last_login field)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      whereClause.updated_at = {
        [Op.gte]: thirtyDaysAgo
      };
    }
    // 'all' means no filter

    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'email', 'first_name', 'last_name']
    });

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No users found matching the criteria'
      });
    }

    // Send bulk email
    const result = await sendBulkEmail(users, subject, message);

    logger.info(`Admin sent bulk email to ${users.length} users: ${result.successful} successful, ${result.failed} failed`);

    res.status(200).json({
      success: true,
      message: 'Bulk email sent successfully',
      data: {
        total: result.total,
        successful: result.successful,
        failed: result.failed
      }
    });
  } catch (error) {
    logger.error('Send bulk email error:', error);
    next(error);
  }
};

module.exports = exports;
