const { User, Farmer, HarvestBatch, CropTemplate } = require('../models');
const { Op } = require('sequelize');

// Get farmer profile
const getFarmerProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const farmer = await User.findByPk(userId, {
      include: [
        {
          model: Farmer,
          attributes: ['farm_name', 'farm_size', 'primary_crops', 'certification_level', 'rating']
        }
      ],
      attributes: ['id', 'name', 'phone_number', 'email', 'location', 'is_verified', 'created_at']
    });
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer profile not found'
      });
    }
    
    // Get farmer statistics
    const batchStats = await HarvestBatch.findAll({
      where: { farmer_id: userId },
      attributes: [
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total_batches'],
        [require('sequelize').fn('COUNT', require('sequelize').literal("CASE WHEN current_status = 'sold' THEN 1 END")), 'sold_batches'],
        [require('sequelize').fn('COUNT', require('sequelize').literal("CASE WHEN current_status = 'listed' THEN 1 END")), 'active_listings'],
        [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN current_status = 'sold' THEN quantity ELSE 0 END")), 'total_sold_quantity']
      ],
      raw: true
    });
    
    const stats = batchStats[0] || {
      total_batches: 0,
      sold_batches: 0,
      active_listings: 0,
      total_sold_quantity: 0
    };
    
    res.json({
      success: true,
      data: {
        ...farmer.toJSON(),
        statistics: stats
      }
    });
  } catch (error) {
    console.error('Get farmer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch farmer profile'
    });
  }
};

// Update farmer profile
const updateFarmerProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      email,
      location,
      farm_name,
      farm_size,
      primary_crops,
      certification_level
    } = req.body;
    
    // Update user table
    const userUpdateData = {};
    if (name) userUpdateData.name = name;
    if (email) userUpdateData.email = email;
    if (location) userUpdateData.location = location;
    
    if (Object.keys(userUpdateData).length > 0) {
      await User.update(userUpdateData, {
        where: { id: userId }
      });
    }
    
    // Update farmer table
    const farmerUpdateData = {};
    if (farm_name) farmerUpdateData.farm_name = farm_name;
    if (farm_size) farmerUpdateData.farm_size = parseFloat(farm_size);
    if (primary_crops) farmerUpdateData.primary_crops = primary_crops;
    if (certification_level) farmerUpdateData.certification_level = certification_level;
    
    if (Object.keys(farmerUpdateData).length > 0) {
      await Farmer.update(farmerUpdateData, {
        where: { user_id: userId }
      });
    }
    
    // Return updated profile
    const updatedFarmer = await User.findByPk(userId, {
      include: [
        {
          model: Farmer,
          attributes: ['farm_name', 'farm_size', 'primary_crops', 'certification_level', 'rating']
        }
      ],
      attributes: ['id', 'name', 'phone_number', 'email', 'location', 'is_verified', 'created_at']
    });
    
    res.json({
      success: true,
      message: 'Farmer profile updated successfully',
      data: updatedFarmer
    });
  } catch (error) {
    console.error('Update farmer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update farmer profile'
    });
  }
};

// Get farmer dashboard data
const getFarmerDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get recent batches
    const recentBatches = await HarvestBatch.findAll({
      where: { farmer_id: userId },
      include: [
        {
          model: CropTemplate,
          as: 'cropTemplate',
          attributes: ['name', 'category']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 5
    });
    
    // Get batch statistics by status
    const statusStats = await HarvestBatch.findAll({
      where: { farmer_id: userId },
      attributes: [
        'current_status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        [require('sequelize').fn('SUM', require('sequelize').col('quantity')), 'total_quantity']
      ],
      group: ['current_status'],
      raw: true
    });
    
    // Get monthly harvest data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyData = await HarvestBatch.findAll({
      where: {
        farmer_id: userId,
        harvest_date: {
          [Op.gte]: sixMonthsAgo
        }
      },
      attributes: [
        [require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('harvest_date')), 'month'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'batch_count'],
        [require('sequelize').fn('SUM', require('sequelize').col('quantity')), 'total_quantity']
      ],
      group: [require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('harvest_date'))],
      order: [[require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('harvest_date')), 'ASC']],
      raw: true
    });
    
    res.json({
      success: true,
      data: {
        recent_batches: recentBatches,
        status_statistics: statusStats,
        monthly_harvest_data: monthlyData
      }
    });
  } catch (error) {
    console.error('Get farmer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
};

// Update farmer rating (called after successful transactions)
const updateFarmerRating = async (req, res) => {
  try {
    const { farmer_id, rating } = req.body;
    
    if (!farmer_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Valid farmer_id and rating (1-5) are required'
      });
    }
    
    const farmer = await Farmer.findOne({
      where: { user_id: farmer_id }
    });
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
    }
    
    // Calculate new average rating
    // This is a simplified approach - in production, you'd store individual ratings
    const currentRating = farmer.rating || 0;
    const newRating = currentRating === 0 ? rating : (currentRating + rating) / 2;
    
    await farmer.update({ rating: newRating });
    
    res.json({
      success: true,
      message: 'Farmer rating updated successfully',
      data: { new_rating: newRating }
    });
  } catch (error) {
    console.error('Update farmer rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update farmer rating'
    });
  }
};

module.exports = {
  getFarmerProfile,
  updateFarmerProfile,
  getFarmerDashboard,
  updateFarmerRating
};
