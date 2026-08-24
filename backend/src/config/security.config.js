/**
 * Centralized Security Configuration
 * Production-grade security settings for the application
 */

module.exports = {
  // Password Policy
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPatterns: true,
    preventSequential: true
  },

  // Account Lockout Policy
  accountLockout: {
    maxFailedAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    attemptWindow: 15 * 60 * 1000, // 15 minutes window
    progressiveDelay: [0, 1000, 2000, 4000, 8000] // Progressive delays in ms
  },

  // JWT Configuration
  jwt: {
    accessTokenExpiry: '7d',
    refreshTokenExpiry: '30d',
    issuer: 'talentbridge-api',
    audience: 'talentbridge-client',
    algorithm: 'HS256'
  },

  // Rate Limiting
  rateLimits: {
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100
    },
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 5,
      skipSuccessfulRequests: true
    },
    jobPost: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10
    },
    referral: {
      windowMs: 60 * 60 * 1000,
      max: 20
    }
  },

  // CORS Settings
  cors: {
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-XSRF-TOKEN',
      'X-Requested-With'
    ],
    exposedHeaders: ['X-XSRF-TOKEN'],
    maxAge: 86400 // 24 hours
  },

  // Cookie Settings
  cookies: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },

  // Session Settings
  session: {
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  },

  // Email Validation
  email: {
    maxLength: 254,
    localPartMaxLength: 64,
    allowDisposable: false,
    disposableDomains: [
      'tempmail.com',
      'throwaway.email',
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com',
      'yopmail.com'
    ]
  },

  // Content Security Policy
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },

  // File Upload Settings
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf']
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxFiles: '14d',
    maxSize: '20m',
    sensitiveFields: [
      'password',
      'token',
      'refreshToken',
      'secret',
      'apiKey',
      'authorization'
    ]
  },

  // Security Headers
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  },

  // Database
  database: {
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.DB_SSL === 'true',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
      } : false
    }
  },

  // API
  api: {
    version: 'v1',
    prefix: '/api',
    requestTimeout: 30000, // 30 seconds
    maxRequestSize: '10mb'
  },

  // Feature Flags
  features: {
    emailVerificationRequired: true,
    accountApprovalRequired: false,
    twoFactorAuth: false, // Future feature
    socialLogin: false, // Disabled as requested
    ipWhitelisting: false,
    geoBlocking: false
  },

  // Security Monitoring
  monitoring: {
    trackFailedLogins: true,
    trackSuspiciousActivity: true,
    alertOnMultipleFailedAttempts: true,
    alertThreshold: 3,
    trackIpChanges: true,
    trackUserAgentChanges: true
  }
};
