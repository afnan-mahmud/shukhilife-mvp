const jwt = require('../utils/jwt');
const User = require('../models/User');

/**
 * Middleware to require authentication
 * Reads Authorization header, verifies JWT, and attaches user to req.user
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const token = jwt.extractToken(authHeader);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Invalid token format.'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token);
    
    // Find the user by ID from the token
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. User not found.'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: `Access denied. ${error.message}`
    });
  }
};

/**
 * Middleware to require specific roles
 * Must be used after requireAuth middleware
 * @param {...string} roles - The roles that are allowed
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Similar to requireAuth but doesn't fail if no token is provided
 * Useful for endpoints that work with or without authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(); // No token provided, continue without user
    }

    const token = jwt.extractToken(authHeader);
    
    if (!token) {
      return next(); // Invalid token format, continue without user
    }

    // Verify the token
    const decoded = jwt.verify(token);
    
    // Find the user by ID from the token
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // If token verification fails, continue without user
    next();
  }
};

module.exports = {
  requireAuth,
  requireRole,
  optionalAuth
};
