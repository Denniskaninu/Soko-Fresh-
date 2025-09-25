const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify the access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database to ensure they still exist and are active
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or has been deactivated'
      });
    }

    // Add user info to request object
    req.user = {
      id: user.id,
      user_type: user.user_type,
      phone_number: user.phone_number,
      is_verified: user.is_verified,
      name: user.name
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token'
      });
    } else {
      console.error('Authentication error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication'
      });
    }
  }
};

// Middleware to check if user is verified
const requireVerification = (req, res, next) => {
  if (!req.user.is_verified) {
    return res.status(403).json({
      success: false,
      message: 'Account verification is required to access this resource'
    });
  }
  next();
};

// Role-based access control middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.user_type;
    
    // Allow access if user role is in the allowed roles array
    if (allowedRoles.includes(userRole)) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}, but user is: ${userRole}`
      });
    }
  };
};

// Convenience middleware for farmer-only routes
const requireFarmer = requireRole(['farmer']);

// Convenience middleware for buyer-only routes
const requireBuyer = requireRole(['buyer']);

// Middleware to allow both farmers and buyers
const requireFarmerOrBuyer = requireRole(['farmer', 'buyer']);

// Optional authentication - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      
      if (user) {
        req.user = {
          id: user.id,
          user_type: user.user_type,
          phone_number: user.phone_number,
          is_verified: user.is_verified,
          name: user.name
        };
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we continue even if token is invalid
    next();
  }
};

// Middleware to validate refresh token
const validateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user and check if refresh token matches
    const user = await User.findByPk(decoded.id);
    
    if (!user || user.refresh_token !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    } else {
      console.error('Refresh token validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during token validation'
      });
    }
  }
};

module.exports = {
  authenticateToken,
  requireVerification,
  requireRole,
  requireFarmer,
  requireBuyer,
  requireFarmerOrBuyer,
  optionalAuth,
  validateRefreshToken
};