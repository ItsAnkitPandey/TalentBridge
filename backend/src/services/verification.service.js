const { User } = require('../models');
const { sendVerificationEmail } = require('../services/email');
const { generateToken, hashToken } = require('../utils/security');
const logger = require('../utils/logger');

/**
 * Send email verification token to user
 * @param {object} user - User instance
 * @returns {Promise<string>} - Verification token (unhashed)
 */
exports.sendEmailVerification = async (user) => {
  try {
    // Generate verification token
    const verificationToken = generateToken();
    const hashedToken = hashToken(verificationToken);
    
    // Set token and expiry (24 hours)
    user.email_verification_token = hashedToken;
    user.email_verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();
    
    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    await sendVerificationEmail(user, verificationUrl);
    
    logger.info(`Verification email sent to: ${user.email}`);
    
    return verificationToken;
  } catch (error) {
    logger.error('Failed to send verification email:', error);
    throw error;
  }
};

/**
 * Verify email token
 * @param {string} token - Verification token
 * @returns {Promise<object>} - {success, message, user}
 */
exports.verifyEmailToken = async (token) => {
  try {
    const hashedToken = hashToken(token);
    
    const user = await User.findOne({
      where: {
        email_verification_token: hashedToken,
        email_verification_expires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid or expired verification token'
      };
    }
    
    // Mark user as verified
    user.is_verified = true;
    user.email_verification_token = null;
    user.email_verification_expires = null;
    await user.save();
    
    logger.info(`Email verified successfully for: ${user.email}`);
    
    return {
      success: true,
      message: 'Email verified successfully',
      user
    };
  } catch (error) {
    logger.error('Email verification error:', error);
    throw error;
  }
};

/**
 * Resend verification email
 * @param {string} email - User email
 * @returns {Promise<object>} - {success, message}
 */
exports.resendVerification = async (email) => {
  try {
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    if (user.is_verified) {
      return {
        success: false,
        message: 'Email already verified'
      };
    }
    
    await exports.sendEmailVerification(user);
    
    return {
      success: true,
      message: 'Verification email sent'
    };
  } catch (error) {
    logger.error('Resend verification error:', error);
    throw error;
  }
};
