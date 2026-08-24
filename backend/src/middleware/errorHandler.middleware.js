const winston = require('winston');
const path = require('path');

/**
 * Winston Logger Configuration
 * Provides structured logging with different levels
 */

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'employee-referral-api' },
  transports: [
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write error logs to error.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * Error Handler Middleware
 * Centralized error handling with proper logging and response formatting
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle different types of errors
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${field} = '${value}'. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401);

// Handle Sequelize database errors
const handleSequelizeDatabaseError = (err) => {
  // Handle specific PostgreSQL error codes
  if (err.original?.code === '22P02') {
    // Invalid input syntax for type
    const match = err.message.match(/invalid input syntax for type (\w+): "(.+?)"/i);
    if (match) {
      const [, type, value] = match;
      return new AppError(`Invalid value "${value}" for ${type}. Please provide a valid ${type}.`, 400);
    }
  }
  
  if (err.original?.code === '23505') {
    // Unique constraint violation
    const match = err.message.match(/Key \((.+?)\)=\((.+?)\) already exists/);
    if (match) {
      const [, field, value] = match;
      return new AppError(`${field} "${value}" is already taken.`, 400);
    }
  }
  
  return new AppError('Database error occurred. Please check your input and try again.', 400);
};

const handleSequelizeValidationError = (err) => {
  const errors = err.errors.map(e => e.message);
  const message = `Validation failed. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleSequelizeUniqueConstraintError = (err) => {
  const field = Object.keys(err.fields)[0];
  const message = `${field} already exists. Please use a different value.`;
  return new AppError(message, 400);
};

// Send error response in development
const sendErrorDev = (err, req, res) => {
  logger.error('Error:', {
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.id
  });

  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
    url: req.originalUrl
  });
};

// Send error response in production
const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    logger.error('Operational error:', {
      message: err.message,
      statusCode: err.statusCode,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      user: req.user?.id
    });

    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message
    });
  } 
  // Programming or unknown error: don't leak error details
  else {
    logger.error('Programming error:', {
      error: err,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      user: req.user?.id
    });

    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong. Please try again later.'
    });
  }
};

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    
    // Handle Sequelize errors
    if (err.name === 'SequelizeDatabaseError') error = handleSequelizeDatabaseError(error);
    if (err.name === 'SequelizeValidationError') error = handleSequelizeValidationError(error);
    if (err.name === 'SequelizeUniqueConstraintError') error = handleSequelizeUniqueConstraintError(error);

    sendErrorProd(error, req, res);
  } else {
    // Default to development mode if NODE_ENV not set
    let error = { ...err };
    error.message = err.message;

    // Handle Sequelize errors in development too
    if (err.name === 'SequelizeDatabaseError') error = handleSequelizeDatabaseError(error);
    if (err.name === 'SequelizeValidationError') error = handleSequelizeValidationError(error);
    if (err.name === 'SequelizeUniqueConstraintError') error = handleSequelizeUniqueConstraintError(error);

    sendErrorDev(error, req, res);
  }
};

// Catch async errors wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      user: req.user?.id
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error:', logData);
    } else {
      logger.info('Request completed:', logData);
    }
  });

  next();
};

// Handle unhandled routes
const notFound = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server`, 404);
  next(err);
};

module.exports = {
  logger,
  AppError,
  errorHandler,
  catchAsync,
  requestLogger,
  notFound
};
