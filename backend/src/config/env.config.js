const Joi = require('joi');
require('dotenv').config();

/**
 * Environment Variables Schema
 * Validates all required environment variables at startup
 */
const envSchema = Joi.object({
  // Server Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number()
    .port()
    .default(5000),
  
  // Database Configuration
  DB_HOST: Joi.string()
    .required()
    .description('PostgreSQL database host'),
  DB_PORT: Joi.number()
    .port()
    .default(5432),
  DB_NAME: Joi.string()
    .required()
    .description('PostgreSQL database name'),
  DB_USER: Joi.string()
    .required()
    .description('PostgreSQL database user'),
  DB_PASSWORD: Joi.string()
    .required()
    .description('PostgreSQL database password'),
  DB_DIALECT: Joi.string()
    .valid('postgres', 'mysql', 'sqlite', 'mariadb')
    .default('postgres'),
  
  // JWT Configuration
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT secret key (minimum 32 characters)'),
  JWT_EXPIRES_IN: Joi.string()
    .default('7d')
    .description('JWT expiration time'),
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT refresh token secret'),
  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .default('30d')
    .description('JWT refresh token expiration'),
  
  // OAuth Configuration (Optional)
  GOOGLE_CLIENT_ID: Joi.string()
    .optional()
    .description('Google OAuth Client ID'),
  GOOGLE_CLIENT_SECRET: Joi.string()
    .optional()
    .description('Google OAuth Client Secret'),
  GOOGLE_CALLBACK_URL: Joi.string()
    .uri()
    .optional()
    .description('Google OAuth callback URL'),
  
  LINKEDIN_CLIENT_ID: Joi.string()
    .optional()
    .description('LinkedIn OAuth Client ID'),
  LINKEDIN_CLIENT_SECRET: Joi.string()
    .optional()
    .description('LinkedIn OAuth Client Secret'),
  LINKEDIN_CALLBACK_URL: Joi.string()
    .uri()
    .optional()
    .description('LinkedIn OAuth callback URL'),
  
  // File Upload Configuration (Optional)
  CLOUDINARY_CLOUD_NAME: Joi.string()
    .optional()
    .description('Cloudinary cloud name'),
  CLOUDINARY_API_KEY: Joi.string()
    .optional()
    .description('Cloudinary API key'),
  CLOUDINARY_API_SECRET: Joi.string()
    .optional()
    .description('Cloudinary API secret'),
  
  // Email Configuration (Optional)
  EMAIL_HOST: Joi.string()
    .optional()
    .description('SMTP host'),
  EMAIL_PORT: Joi.number()
    .port()
    .optional()
    .description('SMTP port'),
  EMAIL_USER: Joi.string()
    .email()
    .optional()
    .description('SMTP user email'),
  EMAIL_PASSWORD: Joi.string()
    .optional()
    .description('SMTP password'),
  EMAIL_FROM: Joi.string()
    .email()
    .optional()
    .description('Email from address'),
  
  // CORS Configuration
  ALLOWED_ORIGINS: Joi.string()
    .optional()
    .description('Comma-separated list of allowed origins'),
  
  // Frontend URL
  FRONTEND_URL: Joi.string()
    .uri()
    .default('http://localhost:3000')
    .description('Frontend application URL'),
  
  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),
  
  // Security
  BCRYPT_ROUNDS: Joi.number()
    .integer()
    .min(10)
    .max(15)
    .default(12)
    .description('Number of bcrypt rounds'),
  
  // Rate Limiting (Optional)
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .integer()
    .positive()
    .default(900000)
    .description('Rate limit window in milliseconds (default: 15 min)'),
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .integer()
    .positive()
    .default(100)
    .description('Maximum requests per window'),
  
  // Session (Optional)
  SESSION_SECRET: Joi.string()
    .min(32)
    .optional()
    .description('Session secret for cookie signing'),
  
  // Monitoring (Optional)
  SENTRY_DSN: Joi.string()
    .uri()
    .optional()
    .description('Sentry DSN for error tracking'),

  // OAuth TLS debug fallback (Optional, local dev only)
  OAUTH_TLS_INSECURE: Joi.string()
    .valid('true', 'false')
    .optional()
    .description('Disable TLS verification for OAuth provider calls (local debug only)'),
})
  .unknown()
  .required();

/**
 * Validate Environment Variables
 * @returns {Object} Validated environment configuration
 */
function validateEnv() {
  const { error, value: envVars } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => detail.message).join('\n');
    throw new Error(`Environment validation error:\n${errors}`);
  }

  return envVars;
}

/**
 * Configuration Object
 * Centralized configuration with validated values
 */
const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL
    }
  },
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@example.com'
  },
  
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001']
  },
  
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    oauthTlsInsecure: process.env.OAUTH_TLS_INSECURE === 'true'
  },
  
  session: {
    secret: process.env.SESSION_SECRET || 'default-session-secret-change-in-production'
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },
  
  sentry: {
    dsn: process.env.SENTRY_DSN
  },
  
  // Feature flags
  features: {
    oauth: !!(process.env.GOOGLE_CLIENT_ID || process.env.LINKEDIN_CLIENT_ID),
    fileUpload: !!(process.env.CLOUDINARY_CLOUD_NAME),
    email: !!(process.env.EMAIL_HOST)
  }
};

// Validate on module load
try {
  validateEnv();
  console.log('✓ Environment variables validated successfully');
} catch (error) {
  console.error('✗ Environment validation failed:');
  console.error(error.message);
  process.exit(1);
}

module.exports = config;
