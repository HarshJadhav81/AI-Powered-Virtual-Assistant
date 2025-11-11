/**
 * Winston Logger Configuration
 * Provides structured logging with different levels and transports
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : process.env.LOG_LEVEL || 'info';
};

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => {
      const { timestamp, level, message, ...meta } = info;
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
    }
  )
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', '..', 'logs');

// Define transports
const transports = [
  // Console transport (always enabled)
  new winston.transports.Console({
    format: consoleFormat
  }),
  
  // Error log file
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// Add debug file transport in development
if (process.env.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'debug.log'),
      level: 'debug',
      maxsize: 5242880,
      maxFiles: 3
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false
});

/**
 * HTTP request logger middleware
 */
export const httpLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log after response is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id
    };
    
    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error('HTTP Request Error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request Warning', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  });
  
  next();
};

/**
 * API logger utility functions
 */
export const loggers = {
  /**
   * Log API request
   */
  apiRequest: (service, endpoint, params = {}) => {
    logger.info(`API Request: ${service}`, {
      service,
      endpoint,
      params
    });
  },

  /**
   * Log API response
   */
  apiResponse: (service, endpoint, status, duration) => {
    logger.info(`API Response: ${service}`, {
      service,
      endpoint,
      status,
      duration: `${duration}ms`
    });
  },

  /**
   * Log API error
   */
  apiError: (service, endpoint, error) => {
    logger.error(`API Error: ${service}`, {
      service,
      endpoint,
      error: error.message,
      stack: error.stack
    });
  },

  /**
   * Log authentication events
   */
  auth: (event, userId, details = {}) => {
    logger.info(`Auth Event: ${event}`, {
      event,
      userId,
      ...details
    });
  },

  /**
   * Log security events
   */
  security: (event, severity, details = {}) => {
    const logFn = severity === 'high' ? logger.error : logger.warn;
    logFn(`Security Event: ${event}`, {
      event,
      severity,
      ...details
    });
  },

  /**
   * Log database operations
   */
  database: (operation, collection, details = {}) => {
    logger.debug(`Database Operation: ${operation}`, {
      operation,
      collection,
      ...details
    });
  },

  /**
   * Log cache operations
   */
  cache: (operation, key, hit = null) => {
    logger.debug(`Cache ${operation}`, {
      operation,
      key,
      hit: hit !== null ? (hit ? 'HIT' : 'MISS') : undefined
    });
  },

  /**
   * Log voice command
   */
  voiceCommand: (userId, command, result) => {
    logger.info('Voice Command', {
      userId,
      command,
      result: result.success ? 'success' : 'failed'
    });
  },

  /**
   * Log AI interaction
   */
  aiInteraction: (userId, input, output, model) => {
    logger.info('AI Interaction', {
      userId,
      inputLength: input.length,
      outputLength: output.length,
      model
    });
  }
};

/**
 * Performance monitoring logger
 */
export class PerformanceLogger {
  constructor(operation) {
    this.operation = operation;
    this.start = Date.now();
  }

  end(details = {}) {
    const duration = Date.now() - this.start;
    logger.debug(`Performance: ${this.operation}`, {
      operation: this.operation,
      duration: `${duration}ms`,
      ...details
    });
    return duration;
  }
}

/**
 * Create child logger with context
 */
export const createContextLogger = (context) => {
  return {
    error: (message, meta = {}) => logger.error(message, { context, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { context, ...meta }),
    info: (message, meta = {}) => logger.info(message, { context, ...meta }),
    http: (message, meta = {}) => logger.http(message, { context, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { context, ...meta })
  };
};

export default logger;
