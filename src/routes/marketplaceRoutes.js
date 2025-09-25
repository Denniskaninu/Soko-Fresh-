const express = require('express');
const router = express.Router();
const { 
  getMarketplaceListings,
  getListingDetails,
  incrementViews
} = require('../controllers/marketplaceController');

// Public marketplace routes
router.get('/listings', getMarketplaceListings);
router.get('/listings/:id', getListingDetails);
router.post('/listings/:id/view', incrementViews);

module.exports = router;
