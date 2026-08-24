const crypto = require('crypto');

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} - Hex encoded token
 */
exports.generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash a token for secure storage
 * @param {string} token - Token to hash
 * @returns {string} - Hashed token
 */
exports.hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Validate email domain against corporate email patterns
 * @param {string} email - Email address to validate
 * @returns {object} - {isValid, isCorporate, domain}
 */
exports.validateEmailDomain = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  
  // Disposable email domains to block
  const disposableDomains = [
    'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'throwaway.email',
    'mailinator.com', 'trashmail.com', 'yopmail.com', 'fakeinbox.com',
    'temp-mail.org', 'getnada.com', 'maildrop.cc', 'mohmal.com'
  ];
  
  // Personal email domains that shouldn't be used for corporate registration
  const personalDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
    'icloud.com', 'aol.com', 'mail.com', 'zoho.com', 'protonmail.com'
  ];
  
  if (!domain) {
    return { isValid: false, isCorporate: false, domain: null, reason: 'Invalid email format' };
  }
  
  // Check if disposable
  if (disposableDomains.includes(domain)) {
    return { isValid: false, isCorporate: false, domain, reason: 'Disposable email domains are not allowed' };
  }
  
  // Check if personal email
  if (personalDomains.includes(domain)) {
    return { isValid: true, isCorporate: false, domain, reason: 'Personal email domain detected' };
  }
  
  // Assume corporate email
  return { isValid: true, isCorporate: true, domain };
};

/**
 * Validate file upload for security
 * @param {object} file - File object with mimetype and size
 * @param {object} options - Validation options
 * @returns {object} - {isValid, error}
 */
exports.validateFileUpload = (file, options = {}) => {
  const {
    allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedExtensions = ['.pdf', '.doc', '.docx']
  } = options;
  
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }
  
  // Check file size
  if (file.size > maxSize) {
    return { isValid: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` };
  }
  
  // Check MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    return { isValid: false, error: 'Invalid file type. Only PDF and Word documents are allowed' };
  }
  
  // Check file extension
  const extension = file.originalname?.toLowerCase().match(/\.[^.]*$/)?.[0];
  if (!extension || !allowedExtensions.includes(extension)) {
    return { isValid: false, error: 'Invalid file extension' };
  }
  
  // Check for double extensions (e.g., .pdf.exe)
  const parts = file.originalname.split('.');
  if (parts.length > 2) {
    return { isValid: false, error: 'Multiple file extensions detected' };
  }
  
  return { isValid: true };
};

/**
 * Validate URL for job application links
 * @param {string} url - URL to validate
 * @param {string} companyDomain - Expected company domain
 * @returns {object} - {isValid, error}
 */
exports.validateJobUrl = (url, companyDomain = null) => {
  if (!url) {
    return { isValid: true }; // URL is optional
  }
  
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Invalid URL protocol. Only HTTP and HTTPS are allowed' };
    }
    
    // Check for suspicious domains
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq'];
    if (suspiciousTLDs.some(tld => urlObj.hostname.endsWith(tld))) {
      return { isValid: false, error: 'URL domain appears suspicious' };
    }
    
    // If company domain provided, verify URL is from company domain
    if (companyDomain && !urlObj.hostname.includes(companyDomain)) {
      return { isValid: false, error: 'Job URL must be from official company domain' };
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

/**
 * Validate LinkedIn profile URL
 * @param {string} url - LinkedIn URL to validate
 * @returns {object} - {isValid, error}
 */
exports.validateLinkedInUrl = (url) => {
  if (!url) {
    return { isValid: true }; // Optional field
  }
  
  const linkedInPattern = /^https?:\/\/(www\.)?linkedin\.com\/(in|pub|profile)\/.+/i;
  
  if (!linkedInPattern.test(url)) {
    return { isValid: false, error: 'Invalid LinkedIn profile URL' };
  }
  
  return { isValid: true };
};

/**
 * Check if user has suspicious registration patterns
 * @param {object} userData - User registration data
 * @returns {object} - {isSuspicious, reasons}
 */
exports.detectSuspiciousRegistration = (userData) => {
  const reasons = [];
  
  // Check for very short names
  if (userData.first_name?.length < 2 || userData.last_name?.length < 2) {
    reasons.push('Name too short');
  }
  
  // Check for numeric names
  if (/\d/.test(userData.first_name) || /\d/.test(userData.last_name)) {
    reasons.push('Name contains numbers');
  }
  
  // Check for special characters in names
  if (/[^a-zA-Z\s'-]/.test(userData.first_name) || /[^a-zA-Z\s'-]/.test(userData.last_name)) {
    reasons.push('Name contains invalid characters');
  }
  
  // Check for repeated characters (e.g., "aaaa", "xxxx")
  if (/(.)\1{3,}/.test(userData.first_name) || /(.)\1{3,}/.test(userData.last_name)) {
    reasons.push('Name contains suspicious patterns');
  }
  
  return {
    isSuspicious: reasons.length > 0,
    reasons
  };
};

/**
 * Rate limit key generator for different actions
 * @param {string} action - Action type (register, job_post, referral)
 * @param {string} identifier - User identifier (email, user_id, ip)
 * @returns {string} - Rate limit key
 */
exports.generateRateLimitKey = (action, identifier) => {
  return `ratelimit:${action}:${identifier}`;
};
