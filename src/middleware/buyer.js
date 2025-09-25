const buyerMiddleware = (req, res, next) => {
  if (req.user.user_type !== 'buyer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Buyer account required.'
    });
  }
  next();
};

module.exports = buyerMiddleware;