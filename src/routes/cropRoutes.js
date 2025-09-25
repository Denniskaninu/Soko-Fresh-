const express = require('express');
const router = express.Router();

const { getCropTemplates, createCropTemplate } = require('../controllers/cropController');
const { authenticateToken, requireFarmer } = require('../middleware/auth');

// Public routes
router.get('/templates', getCropTemplates);

// Protected routes (farmer only)
router.post('/templates', authenticateToken, requireFarmer, createCropTemplate);

module.exports = router;
