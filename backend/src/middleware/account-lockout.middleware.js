/**
 * Account Lockout Middleware - Production Grade
 * Prevents brute force attacks by locking accounts after failed login attempts
 * Uses in-memory store (upgrade to Redis for production clustering)
 */

const logger = require('../utils/logger');

// In-memory store for failed attempts (use Redis in production for distributed systems)
const failedAttempts = new Map();
const lockedAccounts = new Map();

// Configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes window
const PROGRESSIVE_DELAY = [0, 1000, 2000, 4000, 8000]; // Progressive delays in ms

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  
  // Clean expired lockouts
  for (const [email, lockData] of lockedAccounts.entries()) {
    if (now > lockData.lockedUntil) {
      lockedAccounts.delete(email);
      failedAttempts.delete(email);
      logger.info(`Account lockout expired for: ${email}`);
    }
  }
  
  // Clean expired attempts
  for (const [email, attemptData] of failedAttempts.entries()) {
    if (now > attemptData.windowStart + ATTEMPT_WINDOW) {
      failedAttempts.delete(email);
    }
  }
}, 60 * 1000); // Run every minute

/**
 * Check if account is currently locked
 */
const isAccountLocked = (email) => {
  const lockData = lockedAccounts.get(email);
  if (!lockData) return false;
  
  const now = Date.now();
  if (now > lockData.lockedUntil) {
    // Lock expired
    lockedAccounts.delete(email);
    failedAttempts.delete(email);
    return false;
  }
  
  return true;
};

/**
 * Get remaining lockout time in seconds
 */
const getRemainingLockoutTime = (email) => {
  const lockData = lockedAccounts.get(email);
  if (!lockData) return 0;
  
  const remaining = Math.ceil((lockData.lockedUntil - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
};

/**
 * Record failed login attempt
 */
const recordFailedAttempt = (email, ip) => {
  const now = Date.now();
  let attemptData = failedAttempts.get(email);
  
  if (!attemptData || now > attemptData.windowStart + ATTEMPT_WINDOW) {
    // Start new window
    attemptData = {
      count: 1,
      windowStart: now,
      ips: [ip],
      lastAttempt: now
    };
  } else {
    // Increment within window
    attemptData.count++;
    attemptData.lastAttempt = now;
    if (!attemptData.ips.includes(ip)) {
      attemptData.ips.push(ip);
    }
  }
  
  failedAttempts.set(email, attemptData);
  
  // Check if should lock account
  if (attemptData.count >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_DURATION;
    lockedAccounts.set(email, {
      lockedAt: now,
      lockedUntil,
      reason: 'Too many failed login attempts',
      attemptCount: attemptData.count,
      ips: attemptData.ips
    });
    
    logger.warn(`Account locked due to failed attempts`, {
      email,
      attempts: attemptData.count,
      ips: attemptData.ips,
      lockedUntil: new Date(lockedUntil)
    });
    
    return true; // Account is now locked
  }
  
  logger.info(`Failed login attempt recorded`, {
    email,
    attemptNumber: attemptData.count,
    remainingAttempts: MAX_FAILED_ATTEMPTS - attemptData.count,
    ip
  });
  
  return false;
};

/**
 * Clear failed attempts on successful login
 */
const clearFailedAttempts = (email) => {
  if (failedAttempts.has(email)) {
    logger.info(`Cleared failed login attempts for: ${email}`);
    failedAttempts.delete(email);
  }
};

/**
 * Get progressive delay based on attempt count
 */
const getProgressiveDelay = (email) => {
  const attemptData = failedAttempts.get(email);
  if (!attemptData) return 0;
  
  const delayIndex = Math.min(attemptData.count - 1, PROGRESSIVE_DELAY.length - 1);
  return PROGRESSIVE_DELAY[delayIndex] || 0;
};

/**
 * Middleware to check account lockout before login
 */
const checkAccountLockout = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return next();
  }
  
  const emailLower = email.toLowerCase().trim();
  
  // Check if account is locked
  if (isAccountLocked(emailLower)) {
    const remainingTime = getRemainingLockoutTime(emailLower);
    const lockData = lockedAccounts.get(emailLower);
    
    logger.warn(`Login attempt on locked account`, {
      email: emailLower,
      ip: req.ip,
      remainingLockoutSeconds: remainingTime
    });
    
    return res.status(423).json({
      success: false,
      message: `Account temporarily locked due to multiple failed login attempts. Please try again in ${Math.ceil(remainingTime / 60)} minutes.`,
      lockedUntil: lockData.lockedUntil,
      remainingSeconds: remainingTime,
      code: 'ACCOUNT_LOCKED'
    });
  }
  
  // Apply progressive delay if there are previous failed attempts
  const delay = getProgressiveDelay(emailLower);
  if (delay > 0) {
    logger.debug(`Applying progressive delay: ${delay}ms for ${emailLower}`);
    setTimeout(() => next(), delay);
  } else {
    next();
  }
};

/**
 * Get account lockout statistics (for admin/monitoring)
 */
const getLockoutStats = () => {
  return {
    currentlyLocked: lockedAccounts.size,
    accountsWithFailedAttempts: failedAttempts.size,
    lockedAccounts: Array.from(lockedAccounts.entries()).map(([email, data]) => ({
      email,
      lockedAt: new Date(data.lockedAt),
      lockedUntil: new Date(data.lockedUntil),
      attemptCount: data.attemptCount,
      ips: data.ips
    }))
  };
};

/**
 * Manually unlock account (admin function)
 */
const unlockAccount = (email) => {
  const emailLower = email.toLowerCase().trim();
  lockedAccounts.delete(emailLower);
  failedAttempts.delete(emailLower);
  logger.info(`Account manually unlocked: ${emailLower}`);
};

module.exports = {
  checkAccountLockout,
  isAccountLocked,
  recordFailedAttempt,
  clearFailedAttempts,
  getRemainingLockoutTime,
  getLockoutStats,
  unlockAccount
};
