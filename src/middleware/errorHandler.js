const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);

  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Handle specific error types
  if (error.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = error.errors.map(e => e.message).join(', ');
  } else if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409; // Conflict
    message = 'A record with this value already exists.';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired.';
  }

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? message : 'An unexpected error occurred.',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

module.exports = errorHandler;
