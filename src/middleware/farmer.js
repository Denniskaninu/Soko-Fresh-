// src/middleware/farmer.js
const farmerMiddleware = (req, res, next) => {
  if (!req.user || req.user.user_type !== 'farmer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Farmer account required.'
    });
  }
  next();
};

module.exports = farmerMiddleware;
