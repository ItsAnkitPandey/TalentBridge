/**
 * JWT Token Blacklist Service - Production Grade
 * Implements token revocation for logout and security events
 * Uses in-memory store (upgrade to Redis for production clustering)
 */

const jwt = require('jsonwebtoken');
const logger = require('./logger');

// In-memory blacklist (use Redis in production for distributed systems)
const blacklistedTokens = new Map();

// Configuration
const CLEANUP_INTERVAL = 60 * 60 * 1000; // Clean up every hour

/**
 * Clean up expired tokens periodically
 */
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [token, expiryTime] of blacklistedTokens.entries()) {
    if (now > expiryTime) {
      blacklistedTokens.delete(token);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.info(`Cleaned ${cleaned} expired tokens from blacklist`);
  }
}, CLEANUP_INTERVAL);

/**
 * Add token to blacklist
 * @param {string} token - JWT token to blacklist
 * @param {number} expiryTime - Token expiry timestamp (ms)
 */
const blacklistToken = (token, expiryTime = null) => {
  try {
    // If expiry not provided, decode token to get it
    if (!expiryTime) {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        expiryTime = decoded.exp * 1000; // Convert to milliseconds
      } else {
        // Default to 7 days if can't decode
        expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
      }
    }
    
    blacklistedTokens.set(token, expiryTime);
    
    logger.info('Token blacklisted', {
      tokenPreview: token.substring(0, 20) + '...',
      expiresAt: new Date(expiryTime)
    });
    
    return true;
  } catch (error) {
    logger.error('Error blacklisting token:', error);
    return false;
  }
};

/**
 * Check if token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {boolean}
 */
const isTokenBlacklisted = (token) => {
  const expiryTime = blacklistedTokens.get(token);
  
  if (!expiryTime) {
    return false;
  }
  
  // Check if still valid (not expired)
  const now = Date.now();
  if (now > expiryTime) {
    // Token expired, remove from blacklist
    blacklistedTokens.delete(token);
    return false;
  }
  
  return true;
};

/**
 * Blacklist all tokens for a specific user
 * Useful when user changes password or account is compromised
 * @param {string} userId - User ID
 */
const blacklistUserTokens = (userId) => {
  // Note: This is a simplified version
  // In production with Redis, you'd maintain a user->tokens mapping
  logger.warn(`User token revocation requested for userId: ${userId}`);
  
  // Store user ID with timestamp for validation
  const revokedAt = Date.now();
  blacklistedTokens.set(`user:${userId}`, revokedAt);
  
  return revokedAt;
};

/**
 * Check if user's tokens were revoked
 * @param {string} userId - User ID
 * @param {number} tokenIssuedAt - Token 'iat' claim (issued at)
 * @returns {boolean}
 */
const isUserTokenRevoked = (userId, tokenIssuedAt) => {
  const revokedAt = blacklistedTokens.get(`user:${userId}`);
  
  if (!revokedAt) {
    return false;
  }
  
  // Token is revoked if it was issued before the revocation time
  return (tokenIssuedAt * 1000) < revokedAt;
};

/**
 * Get blacklist statistics
 */
const getBlacklistStats = () => {
  return {
    totalBlacklisted: blacklistedTokens.size,
    memoryUsage: process.memoryUsage().heapUsed
  };
};

/**
 * Clear entire blacklist (use with caution!)
 */
const clearBlacklist = () => {
  const size = blacklistedTokens.size;
  blacklistedTokens.clear();
  logger.warn(`Blacklist cleared. ${size} tokens removed.`);
  return size;
};

module.exports = {
  blacklistToken,
  isTokenBlacklisted,
  blacklistUserTokens,
  isUserTokenRevoked,
  getBlacklistStats,
  clearBlacklist
};
