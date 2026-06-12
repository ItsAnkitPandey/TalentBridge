const { Connection, User } = require('../models');
const logger = require('../utils/logger');

// @desc    Follow a user
// @route   POST /api/connections/follow/:userId
// @access  Private
exports.followUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;

    if (targetUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    // Check if user exists
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already following
    const existingConnection = await Connection.findOne({
      where: {
        follower_id: req.user.id,
        following_id: targetUserId
      }
    });

    if (existingConnection) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user'
      });
    }

    await Connection.create({
      follower_id: req.user.id,
      following_id: targetUserId,
      status: 'accepted'
    });

    logger.info(`User ${req.user.id} followed user ${targetUserId}`);

    res.status(201).json({
      success: true,
      message: 'Successfully followed user'
    });
  } catch (error) {
    logger.error('Follow user error:', error);
    next(error);
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/connections/unfollow/:userId
// @access  Private
exports.unfollowUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;

    const connection = await Connection.findOne({
      where: {
        follower_id: req.user.id,
        following_id: targetUserId
      }
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'You are not following this user'
      });
    }

    await connection.destroy();

    logger.info(`User ${req.user.id} unfollowed user ${targetUserId}`);

    res.status(200).json({
      success: true,
      message: 'Successfully unfollowed user'
    });
  } catch (error) {
    logger.error('Unfollow user error:', error);
    next(error);
  }
};

// @desc    Get user's followers
// @route   GET /api/connections/followers/:userId
// @access  Public
exports.getFollowers = async (req, res, next) => {
  try {
    const connections = await Connection.findAll({
      where: { following_id: req.params.userId },
      include: [
        {
          model: User,
          as: 'follower',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture', 'job_title']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        followers: connections.map(conn => conn.follower)
      }
    });
  } catch (error) {
    logger.error('Get followers error:', error);
    next(error);
  }
};

// @desc    Get users that a user is following
// @route   GET /api/connections/following/:userId
// @access  Public
exports.getFollowing = async (req, res, next) => {
  try {
    const connections = await Connection.findAll({
      where: { follower_id: req.params.userId },
      include: [
        {
          model: User,
          as: 'following',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture', 'job_title']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        following: connections.map(conn => conn.following)
      }
    });
  } catch (error) {
    logger.error('Get following error:', error);
    next(error);
  }
};
