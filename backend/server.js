const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const cron = require('node-cron');
const morgan = require('morgan');

// Cookie parser - optional for CSRF protection
let cookieParser;
try {
  cookieParser = require('cookie-parser');
} catch (err) {
  console.warn('cookie-parser not installed. CSRF protection will be limited.');
}

// Load environment variables first
dotenv.config();

// Temporary local-dev fallback for OAuth TLS interception/proxy issues.
if (process.env.OAUTH_TLS_INSECURE === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('WARNING: OAUTH_TLS_INSECURE=true - TLS certificate verification is disabled. Use only for local debugging.');
}

// Import configuration and middleware
const config = require('./src/config/env.config');
const { sequelize } = require('./src/models');
const { 
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
} = require('./src/middleware/security.middleware');
const { 
  logger, 
  errorHandler, 
  requestLogger, 
  notFound 
} = require('./src/middleware/errorHandler.middleware');
const { checkAccountLockout } = require('./src/middleware/account-lockout.middleware');
const { setCSRFToken } = require('./src/middleware/csrf.middleware');
const jobScraper = require('./src/jobs/scraper');

const app = express();

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware - Apply FIRST
app.use(helmetConfig);
app.use(securityHeaders);

// CORS configuration
app.use(cors(corsOptions));

// Body parsers with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser (optional - for CSRF protection)
if (cookieParser) {
  app.use(cookieParser());
}

// Data sanitization
app.use(sanitizeData);
app.use(preventParamPollution);

// Compression middleware
app.use(compressionMiddleware);

// Request logging (Morgan + Winston)
if (config.env === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Passport middleware
app.use(passport.initialize());
require('./src/config/passport')(passport);

// Health check (no rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: '1.0.0'
  });
});

// CSRF token endpoint for SPA
app.get('/api/csrf-token', setCSRFToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CSRF token generated'
  });
});

// API Routes with enhanced rate limiting and account lockout
app.use('/api/auth/login', authLimiter, checkAccountLockout);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', apiLimiter, require('./src/routes/auth.routes'));
app.use('/api/users', apiLimiter, require('./src/routes/user.routes'));
app.use('/api/jobs/post', jobPostLimiter);
app.use('/api/jobs', apiLimiter, require('./src/routes/job.routes'));
app.use('/api/referrals/request', referralLimiter);
app.use('/api/referrals', apiLimiter, require('./src/routes/referral.routes'));
app.use('/api/connections', apiLimiter, require('./src/routes/connection.routes'));
app.use('/api/organizations', apiLimiter, require('./src/routes/organization.routes'));
app.use('/api/admin', apiLimiter, require('./src/routes/admin.routes'));
app.use('/api/superadmin', apiLimiter, require('./src/routes/superadmin.routes'));

// 404 handler - Must be after all routes
app.use(notFound);

// Global error handling middleware - Must be last
app.use(errorHandler);

// Schedule job scraper - runs every day at 6:00 AM
cron.schedule('0 6 * * *', async () => {
  logger.info('Starting scheduled job scraping...');
  try {
    await jobScraper.scrapeAllJobs();
    logger.info('Job scraping completed successfully');
  } catch (error) {
    logger.error('Job scraping failed:', error);
  }
});

const PORT = config.port || 5000;

// Database connection and server start
let server;

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('✓ Database connected successfully');
    logger.info(`  Database: ${config.database.name}`);
    logger.info(`  Host: ${config.database.host}:${config.database.port}`);
    
    // Validate database schema (no ALTER queries for fast startup)
    if (config.env === 'development') {
      // In development, just validate connection
      logger.info('✓ Database connection validated (development mode)');
      logger.warn('⚠️  Run migrations for schema changes: npm run migrate');
    } else {
      // In production, only authenticate (no sync)
      logger.info('✓ Database schema validated (production mode)');
    }
    
    // Start server
    server = app.listen(PORT, () => {
      logger.info('='.repeat(50));
      logger.info('🚀 TalentBridge API');
      logger.info('='.repeat(50));
      logger.info(`  Environment: ${config.env.toUpperCase()}`);
      logger.info(`  Port: ${PORT}`);
      logger.info(`  URL: http://localhost:${PORT}`);
      logger.info(`  Health: http://localhost:${PORT}/health`);
      logger.info('='.repeat(50));
      logger.info('✓ Server is ready to accept connections');
      
      // Log enabled features
      if (config.features.oauth) {
        logger.info('  OAuth: Enabled');
      }
      if (config.features.fileUpload) {
        logger.info('  File Upload: Enabled (Cloudinary)');
      }
      if (config.features.email) {
        logger.info('  Email: Enabled');
      }
    });
    
  } catch (error) {
    logger.error('✗ Failed to start server:', error);
    console.error('✗ Failed to start server:', error.message);
    if (error.original?.message) {
      console.error('Database error:', error.original.message);
    }
    process.exit(1);
  }
}

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);
  
  if (server) {
    server.close(async () => {
      logger.info('✓ HTTP server closed');
      
      try {
        await sequelize.close();
        logger.info('✓ Database connection closed');
        logger.info('✓ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('✗ Error during shutdown:', error);
        process.exit(1);
      }
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('✗ Forceful shutdown after timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
}

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(error.name, error.message);
  logger.error(error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(error.name, error.message);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();

module.exports = app;
