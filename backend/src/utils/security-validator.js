/**
 * Advanced Security Validation Utilities
 * Comprehensive input validation and security checks
 */

const validator = require('validator');
const logger = require('./logger');

/**
 * Enhanced email validation with security checks
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  // Basic format validation
  if (!validator.isEmail(trimmedEmail)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\./,           // Double dots
    /^\.|\.$'/,       // Starts or ends with dot
    /@.*@/,           // Multiple @ symbols
    /[<>]/,           // HTML brackets
    /javascript:/i,   // JavaScript protocol
    /data:/i,         // Data URI
    /[\x00-\x1F\x7F]/ // Control characters
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmedEmail)) {
      logger.warn('Suspicious email pattern detected', { email: trimmedEmail });
      return { valid: false, error: 'Invalid email format' };
    }
  }
  
  // Check email length (RFC 5321)
  if (trimmedEmail.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }
  
  // Extract and validate domain
  const [localPart, domain] = trimmedEmail.split('@');
  
  if (localPart.length > 64) {
    return { valid: false, error: 'Email local part is too long' };
  }
  
  // Check for disposable email domains (optional - add your list)
  const disposableDomains = [
    'tempmail.com',
    'throwaway.email',
    '10minutemail.com',
    'guerrillamail.com'
  ];
  
  if (disposableDomains.includes(domain)) {
    logger.warn('Disposable email domain detected', { email: trimmedEmail });
    return { valid: false, error: 'Disposable email addresses are not allowed', isDisposable: true };
  }
  
  return { valid: true, email: trimmedEmail };
};

/**
 * Advanced password validation with security requirements
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }
  
  const errors = [];
  const suggestions = [];
  
  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password is too long (max 128 characters)');
  }
  
  // Complexity checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&#^()_+\-=\[\]{}|;:,.<>]/.test(password);
  
  if (!hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!hasNumber) {
    errors.push('Password must contain at least one number');
  }
  
  if (!hasSpecial) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak patterns
  const commonPatterns = [
    /^[0-9]+$/,                    // All numbers
    /^[a-zA-Z]+$/,                 // All letters
    /(.)\1{2,}/,                   // Repeated characters (aaa, 111)
    /^(password|admin|user|test)/i, // Common weak passwords
    /^12345/,                      // Sequential numbers
    /^qwerty/i,                    // Keyboard patterns
  ];
  
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      suggestions.push('Avoid common patterns and predictable sequences');
      break;
    }
  }
  
  // Check for sequential characters
  const hasSequential = checkSequentialChars(password);
  if (hasSequential) {
    suggestions.push('Avoid sequential characters (abc, 123)');
  }
  
  // Calculate password strength score
  const strength = calculatePasswordStrength(password);
  
  return {
    valid: errors.length === 0,
    errors,
    suggestions,
    strength,
    hasLowercase,
    hasUppercase,
    hasNumber,
    hasSpecial
  };
};

/**
 * Check for sequential characters
 */
const checkSequentialChars = (str) => {
  for (let i = 0; i < str.length - 2; i++) {
    const code1 = str.charCodeAt(i);
    const code2 = str.charCodeAt(i + 1);
    const code3 = str.charCodeAt(i + 2);
    
    // Check ascending sequence
    if (code2 === code1 + 1 && code3 === code2 + 1) {
      return true;
    }
    
    // Check descending sequence
    if (code2 === code1 - 1 && code3 === code2 - 1) {
      return true;
    }
  }
  return false;
};

/**
 * Calculate password strength score (0-100)
 */
const calculatePasswordStrength = (password) => {
  let score = 0;
  
  // Length bonus
  score += Math.min(password.length * 4, 40);
  
  // Character variety bonus
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[@$!%*?&#^()_+\-=\[\]{}|;:,.<>]/.test(password)) score += 15;
  
  // Multiple character types bonus
  const charTypes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[@$!%*?&#^()_+\-=\[\]{}|;:,.<>]/.test(password)
  ].filter(Boolean).length;
  
  if (charTypes >= 3) score += 15;
  
  // Penalize common patterns
  if (/(.)\1{2,}/.test(password)) score -= 10;
  if (checkSequentialChars(password)) score -= 10;
  
  return Math.max(0, Math.min(100, score));
};

/**
 * Validate and sanitize user input for names
 */
const validateName = (name, fieldName = 'Name') => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  const trimmedName = name.trim();
  
  // Length validation
  if (trimmedName.length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters` };
  }
  
  if (trimmedName.length > 50) {
    return { valid: false, error: `${fieldName} is too long (max 50 characters)` };
  }
  
  // Only allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
    return { valid: false, error: `${fieldName} contains invalid characters` };
  }
  
  // Check for suspicious patterns
  if (/<script|javascript:|data:/i.test(trimmedName)) {
    logger.warn('Suspicious name input detected', { name: trimmedName });
    return { valid: false, error: `${fieldName} contains invalid content` };
  }
  
  return { valid: true, name: trimmedName };
};

/**
 * Validate URL with security checks
 */
const validateURL = (url, allowedProtocols = ['http', 'https']) => {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }
  
  const trimmedURL = url.trim();
  
  // Basic URL validation
  if (!validator.isURL(trimmedURL, { 
    protocols: allowedProtocols,
    require_protocol: true 
  })) {
    return { valid: false, error: 'Invalid URL format' };
  }
  
  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'file:', 'vbscript:'];
  for (const protocol of dangerousProtocols) {
    if (trimmedURL.toLowerCase().startsWith(protocol)) {
      logger.warn('Dangerous URL protocol detected', { url: trimmedURL });
      return { valid: false, error: 'Invalid URL protocol' };
    }
  }
  
  return { valid: true, url: trimmedURL };
};

/**
 * Sanitize HTML input to prevent XSS
 */
const sanitizeHTML = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Basic HTML entity encoding
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate phone number
 */
const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length < 10 || cleaned.length > 15) {
    return { valid: false, error: 'Invalid phone number length' };
  }
  
  return { valid: true, phone: cleaned };
};

/**
 * Check for SQL injection patterns
 */
const detectSQLInjection = (input) => {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(UNION.*SELECT)/i,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /(--|#|\/\*)/,
    /('|";|`)/
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      logger.warn('Possible SQL injection attempt detected', { 
        input: input.substring(0, 100) 
      });
      return true;
    }
  }
  
  return false;
};

/**
 * Validate JWT token format (basic check)
 */
const validateJWTFormat = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  const parts = token.split('.');
  return parts.length === 3;
};

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validateURL,
  validatePhone,
  sanitizeHTML,
  detectSQLInjection,
  validateJWTFormat,
  calculatePasswordStrength
};
