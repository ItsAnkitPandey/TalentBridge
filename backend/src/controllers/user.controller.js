const { User, Organization } = require('../models');
const logger = require('../utils/logger');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'logo']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedUpdates = [
      'first_name',
      'last_name',
      'bio',
      'phone',
      'linkedin_url',
      'github_url',
      'job_title',
      'years_of_experience',
      'skills',
      'location',
      'profile_picture',
      'can_provide_referrals'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    await req.user.update(updates);

    const updatedUser = await User.findByPk(req.user.id, {
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'logo']
        }
      ]
    });

    logger.info(`User profile updated: ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
exports.searchUsers = async (req, res, next) => {
  try {
    const { query, skills, organization, canProvideReferrals } = req.query;
    const { Op } = require('sequelize');

    const where = { is_active: true };

    if (query) {
      where[Op.or] = [
        { first_name: { [Op.iLike]: `%${query}%` } },
        { last_name: { [Op.iLike]: `%${query}%` } },
        { job_title: { [Op.iLike]: `%${query}%` } }
      ];
    }

    if (skills) {
      const skillArray = skills.split(',');
      where.skills = { [Op.overlap]: skillArray };
    }

    if (organization) {
      where.organization_id = organization;
    }

    if (canProvideReferrals === 'true') {
      where.can_provide_referrals = true;
    }

    const users = await User.findAll({
      where,
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'logo']
        }
      ],
      limit: 50
    });

    res.status(200).json({
      success: true,
      data: { users }
    });
  } catch (error) {
    logger.error('Search users error:', error);
    next(error);
  }
};
