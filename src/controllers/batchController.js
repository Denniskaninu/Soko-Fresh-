const { HarvestBatch, CropTemplate, User } = require('../models');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// Generate unique batch ID: CROP-YYMMDD-SEQ
const generateBatchId = async (cropTemplateId) => {
  const cropTemplate = await CropTemplate.findByPk(cropTemplateId);
  if (!cropTemplate) throw new Error('Crop template not found');
  
  const today = new Date();
  const dateStr = today.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
  const cropCode = cropTemplate.name.slice(0, 4).toUpperCase(); // First 4 letters
  
  // Find the next sequence number for today
  const todayBatches = await HarvestBatch.count({
    where: {
      batch_id: {
        [require('sequelize').Op.like]: `${cropCode}-${dateStr}-%`
      }
    }
  });
  
  const sequence = String(todayBatches + 1).padStart(3, '0');
  return `${cropCode}-${dateStr}-${sequence}`;
};

// Calculate spoilage risk
const calculateSpoilageRisk = (harvestDate, shelfLifeDays, spoilageSensitivity, storageConditions) => {
  const now = new Date();
  const harvest = new Date(harvestDate);
  const daysInStorage = Math.floor((now - harvest) / (1000 * 60 * 60 * 24));
  
  // Storage factor (1.0 = perfect, 1.5 = poor storage)
  const storageQuality = storageConditions?.temperature_controlled ? 1.0 : 1.3;
  const humidityFactor = storageConditions?.humidity_controlled ? 1.0 : 1.2;
  const storageFactor = storageQuality * humidityFactor;
  
  // Risk Score = (Days in Storage / Shelf Life) × Sensitivity × Storage Factor
  const riskScore = (daysInStorage / shelfLifeDays) * (spoilageSensitivity / 10) * storageFactor;
  
  // Convert to risk level (1-5 scale)
  if (riskScore <= 0.3) return 1; // Very Low
  if (riskScore <= 0.5) return 2; // Low  
  if (riskScore <= 0.7) return 3; // Medium
  if (riskScore <= 0.9) return 4; // High
  return 5; // Very High
};

// Get all batches for a farmer
const getFarmerBatches = async (req, res) => {
  try {
    const farmerId = req.user.id;
    
    const batches = await HarvestBatch.findAll({
      where: { farmer_id: farmerId },
      include: [
        {
          model: CropTemplate,
          as: 'cropTemplate',
          attributes: ['name', 'category', 'spoilage_sensitivity', 'typical_shelf_life_days']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // Update spoilage risk for each batch
    const batchesWithRisk = batches.map(batch => {
      const riskLevel = calculateSpoilageRisk(
        batch.harvest_date,
        batch.cropTemplate.typical_shelf_life_days,
        batch.cropTemplate.spoilage_sensitivity,
        batch.storage_conditions
      );
      
      return {
        ...batch.toJSON(),
        spoilage_risk_level: riskLevel
      };
    });
    
    res.json({
      success: true,
      data: batchesWithRisk
    });
  } catch (error) {
    console.error('Get farmer batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch batches'
    });
  }
};

// Create new harvest batch
const createBatch = async (req, res) => {
  try {
    const farmerId = req.user.id;
    const {
      crop_template_id,
      quantity,
      unit,
      harvest_date,
      storage_conditions
    } = req.body;
    
    // Validate required fields
    if (!crop_template_id || !quantity || !unit || !harvest_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: crop_template_id, quantity, unit, harvest_date'
      });
    }
    
    // Generate unique batch ID
    const batchId = await generateBatchId(crop_template_id);
    
    // Create batch
    const batch = await HarvestBatch.create({
      id: uuidv4(),
      batch_id: batchId,
      farmer_id: farmerId,
      crop_template_id,
      quantity: parseFloat(quantity),
      unit,
      harvest_date: new Date(harvest_date),
      storage_conditions: storage_conditions || {},
      current_status: 'available'
    });
    
    // Get full batch data with crop template
    const fullBatch = await HarvestBatch.findByPk(batch.id, {
      include: [
        {
          model: CropTemplate,
          as: 'cropTemplate',
          attributes: ['name', 'category', 'spoilage_sensitivity', 'typical_shelf_life_days']
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Harvest batch created successfully',
      data: fullBatch
    });
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create batch'
    });
  }
};

// Generate QR code for batch
const generateQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    const farmerId = req.user.id;
    
    // Find batch and verify ownership
    const batch = await HarvestBatch.findOne({
      where: { 
        id,
        farmer_id: farmerId 
      },
      include: [
        {
          model: CropTemplate,
          as: 'cropTemplate'
        }
      ]
    });
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }
    
    // Create QR code data (URL to batch details)
    const qrData = {
      batchId: batch.batch_id,
      farmerId: batch.farmer_id,
      crop: batch.cropTemplate.name,
      harvestDate: batch.harvest_date,
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/batch/${batch.id}`
    };
    
    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Update batch with QR code URL
    await batch.update({
      qr_code_url: qrCodeDataURL
    });
    
    res.json({
      success: true,
      message: 'QR code generated successfully',
      data: {
        qr_code_url: qrCodeDataURL,
        batch_id: batch.batch_id
      }
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code'
    });
  }
};

// Update batch status
const updateBatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const farmerId = req.user.id;
    
    const validStatuses = ['available', 'listed', 'sold', 'spoiled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: available, listed, sold, or spoiled'
      });
    }
    
    const batch = await HarvestBatch.findOne({
      where: { 
        id,
        farmer_id: farmerId 
      }
    });
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }
    
    await batch.update({ current_status: status });
    
    res.json({
      success: true,
      message: 'Batch status updated successfully',
      data: { 
        id: batch.id,
        batch_id: batch.batch_id,
        status: batch.current_status 
      }
    });
  } catch (error) {
    console.error('Update batch status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update batch status'
    });
  }
};

// Get single batch details
const getBatchDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const farmerId = req.user.id;
    
    const batch = await HarvestBatch.findOne({
      where: { 
        id,
        farmer_id: farmerId 
      },
      include: [
        {
          model: CropTemplate,
          as: 'cropTemplate'
        }
      ]
    });
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }
    
    res.json({
      success: true,
      data: batch
    });
  } catch (error) {
    console.error('Get batch details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch batch details'
    });
  }
};

// Update batch details
const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const farmerId = req.user.id;
    const {
      quantity,
      unit,
      harvest_date,
      storage_conditions
    } = req.body;
    
    const batch = await HarvestBatch.findOne({
      where: { 
        id,
        farmer_id: farmerId 
      }
    });
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }
    
    // Prevent updates if batch is sold
    if (batch.current_status === 'sold') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a sold batch'
      });
    }
    
    const updateData = {};
    if (quantity) updateData.quantity = parseFloat(quantity);
    if (unit) updateData.unit = unit;
    if (harvest_date) updateData.harvest_date = new Date(harvest_date);
    if (storage_conditions) updateData.storage_conditions = storage_conditions;
    
    await batch.update(updateData);
    
    res.json({
      success: true,
      message: 'Batch updated successfully',
      data: batch
    });
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update batch'
    });
  }
};

// Delete batch
const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const farmerId = req.user.id;
    
    const batch = await HarvestBatch.findOne({
      where: { 
        id,
        farmer_id: farmerId 
      }
    });
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }
    
    // Prevent deletion if batch is listed or sold
    if (['listed', 'sold'].includes(batch.current_status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a listed or sold batch'
      });
    }
    
    await batch.destroy();
    
    res.json({
      success: true,
      message: 'Batch deleted successfully'
    });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete batch'
    });
  }
};

module.exports = {
  getFarmerBatches,
  createBatch,
  generateQRCode,
  updateBatchStatus,
  calculateSpoilageRisk,
  getBatchDetails,
  updateBatch,
  deleteBatch
};
