const jwt = require('jsonwebtoken');
const config = require('../src/config/env');

/**
 * Sign a JWT token with the given payload
 * @param {Object} payload - The payload to sign
 * @param {string} expires - Expiration time (default: '7d')
 * @returns {string} The signed JWT token
 */
const sign = (payload, expires = '7d') => {
  return jwt.sign(payload, config.JWT_SECRET, { 
    expiresIn: expires,
    issuer: 'ecommerce-lite',
    audience: 'ecommerce-lite-users'
  });
};

/**
 * Verify a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {Object} The decoded payload
 * @throws {Error} If token is invalid or expired
 */
const verify = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET, {
      issuer: 'ecommerce-lite',
      audience: 'ecommerce-lite-users'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - The Authorization header value
 * @returns {string|null} The extracted token or null
 */
const extractToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

module.exports = {
  sign,
  verify,
  extractToken
};
