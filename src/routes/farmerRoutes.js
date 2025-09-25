const express = require('express');
const router = express.Router();

const { 
  getFarmerBatches, 
  createBatch, 
  generateQRCode, 
  updateBatchStatus,
  getBatchDetails,
  updateBatch,
  deleteBatch
} = require('../controllers/batchController');

const {
  createListing,
  getFarmerListings,
  updateListing
} = require('../controllers/marketplaceController');

const {
  getFarmerProfile,
  updateFarmerProfile,
  getFarmerDashboard,
  updateFarmerRating
} = require('../controllers/farmerController');

const { authenticateToken } = require('../middleware/auth');
const farmerMiddleware = require('../middleware/farmer');
const { validate, schemas } = require('../middleware/validation');

// Apply authentication and farmer role middleware
router.use(authenticateToken);
router.use(farmerMiddleware);

// Profile management routes
router.get('/profile', getFarmerProfile);
router.put('/profile', updateFarmerProfile);
router.get('/dashboard', getFarmerDashboard);

// Batch management routes
router.get('/batches', getFarmerBatches);
router.post('/batches', validate(schemas.createBatch), createBatch);
router.get('/batches/:id', getBatchDetails);
router.put('/batches/:id', updateBatch);
router.delete('/batches/:id', deleteBatch);
router.post('/batches/:id/qr-code', generateQRCode);
router.put('/batches/:id/status', updateBatchStatus);

// Marketplace listing routes
router.get('/listings', getFarmerListings);
router.post('/listings', validate(schemas.createListing), createListing);
router.put('/listings/:id', updateListing);

// Rating route (public - can be called by buyers)
router.post('/rating', updateFarmerRating);

module.exports = router;
