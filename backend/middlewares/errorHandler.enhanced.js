/**
 * Centralized Error Handler Middleware
 * Provides consistent error responses across the application
 */

import logger from '../utils/logger.enhanced.js';

/**
 * Custom Error Classes
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

export class ExternalAPIError extends AppError {
  constructor(service, message = 'External API error') {
    super(`${service}: ${message}`, 502);
    this.name = 'ExternalAPIError';
    this.service = service;
  }
}

/**
 * Error response formatter
 */
const formatErrorResponse = (err, req) => {
  const response = {
    success: false,
    error: {
      message: err.message || 'An error occurred',
      type: err.name || 'Error',
      statusCode: err.statusCode || 500,
      timestamp: err.timestamp || new Date().toISOString()
    }
  };

  // Add validation errors if present
  if (err.errors && Array.isArray(err.errors)) {
    response.error.validationErrors = err.errors;
  }

  // Add request ID for tracking
  if (req.id) {
    response.error.requestId = req.id;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'production') {
    response.error.stack = err.stack;
    response.error.path = req.path;
    response.error.method = req.method;
  }

  // Add service info for external API errors
  if (err.service) {
    response.error.service = err.service;
  }

  return response;
};

/**
 * Log error details
 */
const logError = (err, req) => {
  const errorDetails = {
    message: err.message,
    type: err.name,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  };

  // Log based on severity
  if (err.statusCode >= 500) {
    logger.error('Server Error:', errorDetails, { stack: err.stack });
  } else if (err.statusCode >= 400) {
    logger.warn('Client Error:', errorDetails);
  } else {
    logger.info('Request Error:', errorDetails);
  }
};

/**
 * Handle specific error types
 */
const handleMongooseError = (err) => {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return new ValidationError('Validation failed', errors);
  }

  if (err.name === 'CastError') {
    return new ValidationError(`Invalid ${err.path}: ${err.value}`);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return new ConflictError(`${field} already exists`);
  }

  return err;
};

const handleJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }

  return err;
};

const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new ValidationError('File size too large');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ValidationError('Unexpected file field');
  }

  return err;
};

/**
 * Main error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Handle specific error types
  let error = err;

  if (err.name === 'ValidationError' || err.name === 'CastError' || err.code === 11000) {
    error = handleMongooseError(err);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  } else if (err.name === 'MulterError') {
    error = handleMulterError(err);
  }

  // Log error
  logError(error, req);

  // Format response
  const response = formatErrorResponse(error, req);

  // Send response
  res.status(error.statusCode || 500).json(response);
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
};

/**
 * Async handler wrapper to catch promise rejections
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation helper
 */
export const validateRequest = (schema) => {
  return asyncHandler(async (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      throw new ValidationError('Validation failed', errors);
    }

    req.validatedBody = value;
    next();
  });
};

/**
 * Error monitoring (for production)
 */
export const setupErrorMonitoring = () => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
      error: err.message,
      stack: err.stack
    });
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
      error: err.message,
      stack: err.stack
    });
    process.exit(1);
  });

  // Handle SIGTERM for graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('👋 SIGTERM received. Shutting down gracefully...');
    process.exit(0);
  });
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validateRequest,
  setupErrorMonitoring,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalAPIError
};
