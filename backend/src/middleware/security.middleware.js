const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const compression = require('compression');

/**
 * Helmet Security Configuration
 * Protects against common web vulnerabilities
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

/**
 * Rate Limiting Configuration
 * Prevents brute force and DDoS attacks
 */

// General API rate limiter - 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Auth rate limiter - 5 login attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again after 15 minutes',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Job creation rate limiter - 10 posts per hour
const jobPostLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many job posts, please try again later',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'You have reached your hourly job posting limit. Please try again later.'
    });
  }
});

// Referral request limiter - 20 requests per hour
const referralLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many referral requests, please try again later',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'You have reached your hourly referral request limit. Please try again later.'
    });
  }
});

/**
 * MongoDB Query Sanitization
 * Prevents NoSQL injection attacks
 */
const sanitizeData = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ key }) => {
    console.warn(`Potentially malicious input sanitized: ${key}`);
  }
});

/**
 * HTTP Parameter Pollution Protection
 * Prevents parameter pollution attacks
 */
const preventParamPollution = hpp({
  whitelist: ['skills', 'job_type', 'experience_level', 'location']
});

/**
 * Compression Middleware
 * Compresses response bodies for better performance
 */
const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6
});

/**
 * Security Headers Middleware
 * Adds additional security headers
 */
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * CORS Configuration for Production
 */
const corsOptions = {
  origin: function (origin, callback) {
    const whitelist = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : process.env.NODE_ENV === 'development'
        ? ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:3002', 'http://localhost:3003', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3002', 'http://127.0.0.1:3003']
        : ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Log rejected origins in development for debugging
      if (process.env.NODE_ENV === 'development') {
        console.warn(`CORS request rejected from origin: ${origin}`);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 
};

module.exports = {
  helmetConfig,
  apiLimiter,
  authLimiter,
  jobPostLimiter,
  referralLimiter,
  sanitizeData,
  preventParamPollution,
  compressionMiddleware,
  securityHeaders,
  corsOptions
};
