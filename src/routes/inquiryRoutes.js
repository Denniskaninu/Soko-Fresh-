const express = require('express');
const router = express.Router();
const {
  getFarmerInquiries,
  respondToInquiry
} = require('../controllers/inquiryController');
const { authenticateToken } = require('../middleware/auth');
const farmerMiddleware = require('../middleware/farmer');

// Apply authentication and farmer role middleware for farmer-specific routes
router.use(authenticateToken);

// Farmer inquiry routes (farmers responding to inquiries)
router.get('/farmer', farmerMiddleware, getFarmerInquiries);
router.put('/:id/respond', farmerMiddleware, respondToInquiry);

module.exports = router;
