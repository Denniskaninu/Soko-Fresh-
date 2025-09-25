const { Inquiry, MarketplaceListing, HarvestBatch, CropTemplate, User } = require('../models');
const { getIO } = require('../socket');

// Create inquiry (buyer contacts farmer about a listing)
const createInquiry = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const {
      listing_id,
      message,
      quantity_interested,
      proposed_price
    } = req.body;
    
    if (!listing_id || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: listing_id, message'
      });
    }
    
    // Verify listing exists and is active
    const listing = await MarketplaceListing.findOne({
      where: {
        id: listing_id,
        is_active: true
      },
      include: [
        {
          model: HarvestBatch,
          as: 'batch',
          include: [
            {
              model: User,
              as: 'farmer',
              attributes: ['id', 'name']
            },
            {
              model: CropTemplate,
              as: 'cropTemplate',
              attributes: ['name', 'category']
            }
          ]
        }
      ]
    });
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found or not active'
      });
    }
    
    // Check if buyer already has a pending inquiry for this listing
    const existingInquiry = await Inquiry.findOne({
      where: {
        buyer_id: buyerId,
        listing_id,
        status: 'pending'
      }
    });
    
    if (existingInquiry) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending inquiry for this listing'
      });
    }
    
    // Create inquiry
    const inquiry = await Inquiry.create({
      buyer_id: buyerId,
      listing_id,
      message,
      quantity_interested: quantity_interested || null,
      proposed_price: proposed_price || null,
      status: 'pending'
    });
    
    // Increment inquiries count on listing
    await listing.increment('inquiries_count');
    
    // Get full inquiry data for response
    const fullInquiry = await Inquiry.findByPk(inquiry.id, {
      include: [
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'name', 'phone_number', 'location']
        },
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
                  as: 'cropTemplate'
                },
                {
                  model: User,
                  as: 'farmer',
                  attributes: ['id', 'name']
                }
              ]
            }
          ]
        }
      ]
    });
    
    const io = getIO();
    io.to(`listing_${listing_id}`).emit('new-inquiry', fullInquiry);
    io.to(`farmer_${listing.batch.farmer.id}`).emit('new-inquiry', fullInquiry);

    res.status(201).json({
      success: true,
      message: 'Inquiry sent successfully',
      data: fullInquiry
    });
  } catch (error) {
    console.error('Create inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send inquiry'
    });
  }
};

// Get buyer's inquiries
const getBuyerInquiries = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const whereConditions = { buyer_id: buyerId };
    if (status) {
      whereConditions.status = status;
    }
    
    const inquiries = await Inquiry.findAndCountAll({
      where: whereConditions,
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
                  as: 'cropTemplate'
                },
                {
                  model: User,
                  as: 'farmer',
                  attributes: ['id', 'name', 'phone_number', 'location']
                }
              ]
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });
    
    res.json({
      success: true,
      data: {
        inquiries: inquiries.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: inquiries.count,
          pages: Math.ceil(inquiries.count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get buyer inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inquiries'
    });
  }
};

// Get farmer's inquiries (inquiries about their listings)
const getFarmerInquiries = async (req, res) => {
  try {
    const farmerId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where conditions for listings owned by this farmer
    const whereConditions = {};
    if (status) {
      whereConditions.status = status;
    }
    
    const inquiries = await Inquiry.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'name', 'phone_number', 'location']
        },
        {
          model: MarketplaceListing,
          as: 'listing',
          include: [
            {
              model: HarvestBatch,
              as: 'batch',
              where: { farmer_id: farmerId }, // Only inquiries for this farmer's batches
              include: [
                {
                  model: CropTemplate,
                  as: 'cropTemplate'
                }
              ]
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });
    
    res.json({
      success: true,
      data: {
        inquiries: inquiries.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: inquiries.count,
          pages: Math.ceil(inquiries.count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get farmer inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inquiries'
    });
  }
};

// Respond to inquiry (farmer responds to buyer)
const respondToInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const farmerId = req.user.id;
    const { response_message, status } = req.body;
    
    if (!response_message || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: response_message, status'
      });
    }
    
    const validStatuses = ['responded', 'accepted', 'rejected', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: responded, accepted, rejected, or closed'
      });
    }
    
    // Find inquiry and verify it's for farmer's batch
    const inquiry = await Inquiry.findOne({
      where: { id },
      include: [
        {
          model: MarketplaceListing,
          as: 'listing',
          include: [
            {
              model: HarvestBatch,
              as: 'batch',
              where: { farmer_id: farmerId }
            }
          ]
        }
      ]
    });
    
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found or not authorized'
      });
    }
    
    // Update inquiry
    await inquiry.update({
      response_message,
      status,
      responded_at: new Date()
    });
    
    const io = getIO();
    io.to(`inquiry_${id}`).emit('inquiry-response', inquiry);
    io.to(`buyer_${inquiry.buyer_id}`).emit('inquiry-response', inquiry);

    res.json({
      success: true,
      message: 'Inquiry response sent successfully',
      data: inquiry
    });
  } catch (error) {
    console.error('Respond to inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to inquiry'
    });
  }
};

module.exports = {
  createInquiry,
  getBuyerInquiries,
  getFarmerInquiries,
  respondToInquiry
};
