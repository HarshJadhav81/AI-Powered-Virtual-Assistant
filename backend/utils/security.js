/**
 * Enhanced Security Utilities
 * Provides encryption, JWT token management, and secure key generation
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * Generate a cryptographically secure random key
 * @param {number} length - Length in bytes (default: 64 for 512-bit key)
 * @returns {string} Hex-encoded random key
 */
export const generateSecureKey = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a strong JWT secret
 * Recommended minimum: 256 bits (32 bytes)
 * @returns {string} 512-bit JWT secret
 */
export const generateJWTSecret = () => {
  return generateSecureKey(64); // 512 bits
};

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @param {string} encryptionKey - 32-byte hex key
 * @returns {object} { encrypted, iv, authTag }
 */
export const encrypt = (text, encryptionKey = process.env.ENCRYPTION_KEY) => {
  if (!encryptionKey || encryptionKey.length !== 64) {
    throw new Error('Encryption key must be 32 bytes (64 hex characters)');
  }

  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(encryptionKey, 'hex');
  const iv = crypto.randomBytes(16); // Initialization vector
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

/**
 * Decrypt data encrypted with AES-256-GCM
 * @param {object} encryptedData - Object with encrypted, iv, authTag
 * @param {string} encryptionKey - 32-byte hex key
 * @returns {string} Decrypted plain text
 */
export const decrypt = (encryptedData, encryptionKey = process.env.ENCRYPTION_KEY) => {
  if (!encryptionKey || encryptionKey.length !== 64) {
    throw new Error('Encryption key must be 32 bytes (64 hex characters)');
  }

  const { encrypted, iv, authTag } = encryptedData;
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(encryptionKey, 'hex');
  
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

/**
 * Hash password using bcrypt-compatible scrypt
 * @param {string} password - Plain text password
 * @param {number} saltRounds - Cost factor (default: 10)
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password, saltRounds = 10) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = Math.pow(2, saltRounds);
  
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: iterations }, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
};

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash
 * @returns {Promise<boolean>} True if password matches
 */
export const verifyPassword = async (password, hash) => {
  const [salt, key] = hash.split(':');
  
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
};

/**
 * Generate JWT token with enhanced security
 * @param {object} payload - Data to encode
 * @param {string} expiresIn - Token expiration (default: 24h)
 * @returns {string} JWT token
 */
export const generateToken = (payload, expiresIn = '24h') => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret || secret.length < 64) {
    throw new Error('JWT_SECRET must be at least 256 bits (64 hex chars)');
  }
  
  return jwt.sign(payload, secret, {
    expiresIn,
    issuer: 'ai-virtual-assistant',
    audience: 'api-client'
  });
};

/**
 * Generate refresh token (longer expiration)
 * @param {object} payload - Data to encode
 * @returns {string} Refresh token
 */
export const generateRefreshToken = (payload) => {
  return generateToken(payload, '7d'); // 7 days
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded payload or throws error
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  
  return jwt.verify(token, secret, {
    issuer: 'ai-virtual-assistant',
    audience: 'api-client'
  });
};

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Generate API key for third-party integrations
 * @param {string} prefix - Prefix for the key (e.g., 'sk_live_')
 * @returns {string} API key
 */
export const generateAPIKey = (prefix = 'va_') => {
  const random = crypto.randomBytes(32).toString('base64url');
  return `${prefix}${random}`;
};

/**
 * Hash API key for storage
 * @param {string} apiKey - API key to hash
 * @returns {string} SHA-256 hash of API key
 */
export const hashAPIKey = (apiKey) => {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};

/**
 * Rate limiting token bucket implementation
 * @param {string} identifier - User/IP identifier
 * @param {number} maxTokens - Maximum tokens in bucket
 * @param {number} refillRate - Tokens per second
 * @returns {boolean} True if request is allowed
 */
const tokenBuckets = new Map();

export const checkRateLimit = (identifier, maxTokens = 100, refillRate = 10) => {
  const now = Date.now();
  
  if (!tokenBuckets.has(identifier)) {
    tokenBuckets.set(identifier, {
      tokens: maxTokens,
      lastRefill: now
    });
    return true;
  }
  
  const bucket = tokenBuckets.get(identifier);
  const timePassed = (now - bucket.lastRefill) / 1000;
  const tokensToAdd = timePassed * refillRate;
  
  bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;
  
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }
  
  return false;
};

/**
 * Validate environment variables on startup
 * @param {string[]} requiredVars - Array of required env var names
 * @throws {Error} If any required variable is missing
 */
export const validateEnvVars = (requiredVars) => {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
};

/**
 * Mask sensitive data for logging
 * @param {string} data - Sensitive data
 * @param {number} visibleChars - Number of visible chars at start/end
 * @returns {string} Masked data
 */
export const maskSensitiveData = (data, visibleChars = 4) => {
  if (!data || data.length <= visibleChars * 2) {
    return '***';
  }
  
  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const masked = '*'.repeat(Math.max(0, data.length - (visibleChars * 2)));
  
  return `${start}${masked}${end}`;
};

export default {
  generateSecureKey,
  generateJWTSecret,
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  sanitizeInput,
  generateAPIKey,
  hashAPIKey,
  checkRateLimit,
  validateEnvVars,
  maskSensitiveData
};
