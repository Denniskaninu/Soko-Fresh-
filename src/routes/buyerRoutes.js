const express = require('express');
const router = express.Router();
const {
  getBuyerProfile,
  updateBuyerProfile,
  getBuyerDashboard
} = require('../controllers/buyerController');
const {
  createInquiry,
  getBuyerInquiries
} = require('../controllers/inquiryController');
const { authenticateToken } = require('../middleware/auth');
const buyerMiddleware = require('../middleware/buyer');
const { validate, schemas } = require('../middleware/validation');

// Apply authentication and buyer role middleware
router.use(authenticateToken);
router.use(buyerMiddleware);

// Buyer profile routes
router.get('/profile', getBuyerProfile);
router.put('/profile', updateBuyerProfile);
router.get('/dashboard', getBuyerDashboard);

// Buyer inquiry routes
router.post('/inquiries', validate(schemas.createInquiry), createInquiry);
router.get('/inquiries', getBuyerInquiries);

module.exports = router;
