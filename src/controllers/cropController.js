const { CropTemplate } = require('../models');

// Get all crop templates
const getCropTemplates = async (req, res) => {
  try {
    const crops = await CropTemplate.findAll({
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    
    // Group by category for easier frontend handling
    const groupedCrops = crops.reduce((acc, crop) => {
      const category = crop.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(crop);
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        crops,
        grouped: groupedCrops
      }
    });
  } catch (error) {
    console.error('Get crop templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch crop templates'
    });
  }
};

// Create new crop template (admin only)
const createCropTemplate = async (req, res) => {
  try {
    const {
      name,
      category,
      spoilage_sensitivity,
      typical_shelf_life_days,
      storage_recommendations
    } = req.body;
    
    if (!name || !category || !spoilage_sensitivity || !typical_shelf_life_days) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const crop = await CropTemplate.create({
      name,
      category,
      spoilage_sensitivity: parseInt(spoilage_sensitivity),
      typical_shelf_life_days: parseInt(typical_shelf_life_days),
      storage_recommendations: storage_recommendations || {}
    });
    
    res.status(201).json({
      success: true,
      message: 'Crop template created successfully',
      data: crop
    });
  } catch (error) {
    console.error('Create crop template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create crop template'
    });
  }
};

module.exports = {
  getCropTemplates,
  createCropTemplate
};