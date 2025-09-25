const { User, Buyer } = require('../models');

// Get buyer profile
const getBuyerProfile = async (req, res) => {
  try {
    const buyerId = req.user.id;
    
    const buyer = await Buyer.findOne({
      where: { user_id: buyerId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone_number', 'location', 'created_at']
        }
      ]
    });
    
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer profile not found'
      });
    }
    
    res.json({
      success: true,
      data: buyer
    });
  } catch (error) {
    console.error('Get buyer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch buyer profile'
    });
  }
};

// Update buyer profile
const updateBuyerProfile = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const {
      business_name,
      business_type,
      buying_capacity,
      preferred_crops,
      // User fields
      name,
      location
    } = req.body;
    
    // Update user table
    if (name || location) {
      const userUpdateData = {};
      if (name) userUpdateData.name = name;
      if (location) userUpdateData.location = location;
      
      await User.update(userUpdateData, {
        where: { id: buyerId }
      });
    }
    
    // Update or create buyer profile
    const buyerUpdateData = {};
    if (business_name) buyerUpdateData.business_name = business_name;
    if (business_type) buyerUpdateData.business_type = business_type;
    if (buying_capacity) buyerUpdateData.buying_capacity = buying_capacity;
    if (preferred_crops) buyerUpdateData.preferred_crops = preferred_crops;
    
    const [buyer, created] = await Buyer.findOrCreate({
      where: { user_id: buyerId },
      defaults: buyerUpdateData
    });
    
    if (!created) {
      await buyer.update(buyerUpdateData);
    }
    
    // Get updated profile
    const updatedBuyer = await Buyer.findOne({
      where: { user_id: buyerId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone_number', 'location']
        }
      ]
    });
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedBuyer
    });
  } catch (error) {
    console.error('Update buyer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Get buyer preferences/dashboard stats
const getBuyerDashboard = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { Inquiry, MarketplaceListing, HarvestBatch, CropTemplate } = require('../models');
    
    // Get buyer's inquiry stats
    const totalInquiries = await Inquiry.count({
      where: { buyer_id: buyerId }
    });
    
    const pendingInquiries = await Inquiry.count({
      where: { 
        buyer_id: buyerId,
        status: 'pending'
      }
    });
    
    // Get recent inquiries
    const recentInquiries = await Inquiry.findAll({
      where: { buyer_id: buyerId },
      include: [
        {
          model: MarketplaceListing,
          as: 'listing',
          include: [
            {
              model: HarvestBatch,
              as: 'batch',
              include: [
                {
                  model: CropTemplate,
                  as: 'cropTemplate',
                  attributes: ['name', 'category']
                }
              ]
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    // Get marketplace stats
    const totalListings = await MarketplaceListing.count({
      where: { is_active: true }
    });
    
    res.json({
      success: true,
      data: {
        stats: {
          totalInquiries,
          pendingInquiries,
          totalListings
        },
        recentInquiries
      }
    });
  } catch (error) {
    console.error('Get buyer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
};

module.exports = {
  getBuyerProfile,
  updateBuyerProfile,
  getBuyerDashboard
};