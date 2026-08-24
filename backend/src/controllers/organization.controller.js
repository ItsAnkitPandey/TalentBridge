const { Organization } = require('../models');
const logger = require('../utils/logger');

// @desc    Get all organizations
// @route   GET /api/organizations
// @access  Public
exports.getAllOrganizations = async (req, res, next) => {
  try {
    const { search, industry } = req.query;
    const { Op } = require('sequelize');

    const where = { is_active: true };

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (industry) {
      where.industry = industry;
    }

    const organizations = await Organization.findAll({
      where,
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: { organizations }
    });
  } catch (error) {
    logger.error('Get organizations error:', error);
    next(error);
  }
};

// @desc    Get single organization
// @route   GET /api/organizations/:id
// @access  Public
exports.getOrganization = async (req, res, next) => {
  try {
    const organization = await Organization.findByPk(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { organization }
    });
  } catch (error) {
    logger.error('Get organization error:', error);
    next(error);
  }
};

// @desc    Create organization
// @route   POST /api/organizations
// @access  Private (Admin)
exports.createOrganization = async (req, res, next) => {
  try {
    const organization = await Organization.create(req.body);

    logger.info(`Organization created: ${organization.id}`);

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: { organization }
    });
  } catch (error) {
    logger.error('Create organization error:', error);
    next(error);
  }
};

// @desc    Update organization
// @route   PUT /api/organizations/:id
// @access  Private (Admin)
exports.updateOrganization = async (req, res, next) => {
  try {
    const organization = await Organization.findByPk(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    await organization.update(req.body);

    logger.info(`Organization updated: ${organization.id}`);

    res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      data: { organization }
    });
  } catch (error) {
    logger.error('Update organization error:', error);
    next(error);
  }
};
