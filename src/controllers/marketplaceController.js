const db = require('../models');
const { MarketplaceListing, HarvestBatch, CropTemplate, User } = require('../models');
const { calculateSpoilageRisk } = require('./batchController');
const { Op } = require('sequelize');
const { getIO } = require('../socket');
const { getCache } = require('../cache');

// Create marketplace listing
const createListing = async (req, res) => {
  try {
    const farmerId = req.user.id;
    const {
      batch_id,
      price_per_unit,
      currency = 'KES'
    } = req.body;
    
    if (!batch_id || !price_per_unit) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: batch_id, price_per_unit'
      });
    }
    
    // Verify batch ownership and availability
    const batch = await HarvestBatch.findOne({
      where: {
        id: batch_id,
        farmer_id: farmerId,
        current_status: 'available'
      }
    });
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found or not available for listing'
      });
    }
    
    // Check if already listed
    const existingListing = await MarketplaceListing.findOne({
      where: {
        batch_id,
        is_active: true
      }
    });
    
    if (existingListing) {
      return res.status(400).json({
        success: false,
        message: 'Batch is already listed'
      });
    }
    
    // Create listing
    const listing = await MarketplaceListing.create({
      batch_id,
      price_per_unit: parseFloat(price_per_unit),
      currency,
      is_active: true,
      views_count: 0,
      inquiries_count: 0
    });
    
    // Update batch status
    await batch.update({ current_status: 'listed' });
    
    // Get full listing data
    const fullListing = await MarketplaceListing.findByPk(listing.id, {
      include: [
        {
          model: HarvestBatch,
          include: [
            {
              model: CropTemplate,
              as: 'cropTemplate'
            },
            {
              model: User,
              as: 'farmer',
              attributes: ['id', 'name', 'location']
            }
          ]
        }
      ]
    });
    
    const io = getIO();
    io.emit('new-listing', fullListing);

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      data: fullListing
    });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create listing'
    });
  }
};

// Get all active marketplace listings (for buyers)
const getMarketplaceListings = async (req, res) => {
  try {
    const cache = getCache();
    const cacheKey = `listings:${JSON.stringify(req.query)}`;

    const cachedListings = await cache.get(cacheKey);
    if (cachedListings) {
      return res.json({
        success: true,
        data: JSON.parse(cachedListings),
      });
    }

    const {
      crop_category,
      crop_name,
      max_price,
      min_quantity,
      location,
      radius = 50, // km
      spoilage_risk_max = 3,
      page = 1,
      limit = 20
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where conditions
    const whereConditions = {
      is_active: true
    };
    
    if (max_price) {
      whereConditions.price_per_unit = {
        [Op.lte]: parseFloat(max_price)
      };
    }
    
    // Build batch conditions
    const batchConditions = {};
    
    if (min_quantity) {
      batchConditions.quantity = {
        [Op.gte]: parseFloat(min_quantity)
      };
    }
    
    // Build crop conditions
    const cropConditions = {};
    
    if (crop_category) {
      cropConditions.category = crop_category;
    }
    
    if (crop_name) {
      cropConditions.name = {
        [Op.iLike]: `%${crop_name}%`
      };
    }

    const userConditions = [];
    if (location && radius) {
      const [lat, lng] = location.split(',');
      const farmerConditions = {
        location: {
          [Op.ne]: null,
        },
        [Op.and]: db.sequelize.where(
          db.sequelize.fn(
            'ST_DWithin',
            db.sequelize.col('User.location'),
            db.sequelize.fn('ST_MakePoint', lng, lat),
            radius * 1000
          ),
          true
        ),
      };
      userConditions.push(farmerConditions);
    }
    
    const listings = await MarketplaceListing.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: HarvestBatch,
          where: batchConditions,
          include: [
            {
              model: CropTemplate,
              as: 'cropTemplate',
              where: cropConditions
            },
            {
              model: User,
              as: 'farmer',
              attributes: ['id', 'name', 'location'],
              where: {
                [Op.and]: userConditions,
              },
            }
          ]
        }
      ],
      order: [['listed_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
      distinct: true
    });
    
    // Calculate spoilage risk and filter
    const listingsWithRisk = listings.rows
      .map(listing => {
        const batch = listing.batch;
        const riskLevel = calculateSpoilageRisk(
          batch.harvest_date,
          batch.cropTemplate.typical_shelf_life_days,
          batch.cropTemplate.spoilage_sensitivity,
          batch.storage_conditions
        );
        
        return {
          ...listing.toJSON(),
          batch: {
            ...batch.toJSON(),
            spoilage_risk_level: riskLevel
          }
        };
      })
      .filter(listing => listing.batch.spoilage_risk_level <= parseInt(spoilage_risk_max));
    
    const response = {
      listings: listingsWithRisk,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: listings.count,
        pages: Math.ceil(listings.count / parseInt(limit))
      }
    };

    await cache.set(cacheKey, JSON.stringify(response), {
      EX: 60 * 5, // 5 minutes
    });

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Get marketplace listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch marketplace listings'
    });
  }
};

// Get farmer's listings
const getFarmerListings = async (req, res) => {
  try {
    const farmerId = req.user.id;
    
    const listings = await MarketplaceListing.findAll({
      include: [
        {
          model: HarvestBatch,
          where: { farmer_id: farmerId },
          include: [
            {
              model: CropTemplate,
              as: 'cropTemplate'
            }
          ]
        }
      ],
      order: [['listed_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: listings
    });
  } catch (error) {
    console.error('Get farmer listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch farmer listings'
    });
  }
};

// Update listing (deactivate/reactivate)
const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, price_per_unit } = req.body;
    const farmerId = req.user.id;
    
    const listing = await MarketplaceListing.findOne({
      where: { id },
      include: [
        {
          model: HarvestBatch,
          where: { farmer_id: farmerId }
        }
      ]
    });
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }
    
    const updateData = {};
    if (typeof is_active === 'boolean') updateData.is_active = is_active;
    if (price_per_unit) updateData.price_per_unit = parseFloat(price_per_unit);
    
    await listing.update(updateData);
    
    // Update batch status if listing is deactivated
    if (is_active === false) {
      await listing.batch.update({ current_status: 'available' });
    } else if (is_active === true) {
      await listing.batch.update({ current_status: 'listed' });
    }
    
    const io = getIO();
    io.emit('listing-updated', listing);

    res.json({
      success: true,
      message: 'Listing updated successfully',
      data: listing
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update listing'
    });
  }
};

// Add this new function to marketplaceController.js

// Get listing details (with increment view count)
const getListingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const listing = await MarketplaceListing.findOne({
      where: { 
        id,
        is_active: true 
      },
      include: [
        {
          model: HarvestBatch,
          include: [
            {
              model: CropTemplate,
              as: 'cropTemplate'
            },
            {
              model: User,
              as: 'farmer',
              attributes: ['id', 'name', 'location', 'created_at']
            }
          ]
        }
      ]
    });
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }
    
    // Calculate spoilage risk
    const { calculateSpoilageRisk } = require('./batchController');
    const riskLevel = calculateSpoilageRisk(
      listing.batch.harvest_date,
      listing.batch.cropTemplate.typical_shelf_life_days,
      listing.batch.cropTemplate.spoilage_sensitivity,
      listing.batch.storage_conditions
    );
    
    // Increment view count
    await listing.increment('views_count');
    
    const listingWithRisk = {
      ...listing.toJSON(),
      batch: {
        ...listing.batch.toJSON(),
        spoilage_risk_level: riskLevel
      }
    };
    
    res.json({
      success: true,
      data: listingWithRisk
    });
  } catch (error) {
    console.error('Get listing details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listing details'
    });
  }
};

// Increment view count
const incrementViews = async (req, res) => {
  try {
    const { id } = req.params;
    
    const listing = await MarketplaceListing.findByPk(id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }
    
    await listing.increment('views_count');
    
    res.json({
      success: true,
      message: 'View count updated'
    });
  } catch (error) {
    console.error('Increment views error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update view count'
    });
  }
};

module.exports = {
  createListing,
  getMarketplaceListings,
  getFarmerListings,
  updateListing,
  getListingDetails,
  incrementViews
};
