const express = require('express');
const AuthController = require('../controllers/authController');
const { 
  authenticateToken, 
  validateRefreshToken,
  requireVerification 
} = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', validate(schemas.register), AuthController.register);
router.post('/login', validate(schemas.login), AuthController.login);
router.post('/verify-otp', AuthController.verifyOTP);
router.post('/resend-otp', AuthController.resendOTP);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Token refresh route (requires valid refresh token)
router.post('/refresh-token', validateRefreshToken, AuthController.refreshToken);

// Protected routes (require authentication)
router.use(authenticateToken); // Apply authentication middleware to all routes below

router.post('/logout', AuthController.logout);
router.get('/profile', AuthController.getProfile);

// Example of protected route that also requires verification
router.get('/verified-profile', requireVerification, AuthController.getProfile);

module.exports = router;
