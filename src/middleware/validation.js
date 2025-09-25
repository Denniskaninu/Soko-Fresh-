const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    next();
  };
};

// Schemas
const schemas = {
  register: Joi.object({
    user_type: Joi.string().valid('farmer', 'buyer').required(),
    phone_number: Joi.string().pattern(/^[+]?[\d\s\-\(\)]{10,}$/).required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().optional(),
    location: Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required(),
      address: Joi.string().required()
    }).optional()
  }),
  login: Joi.object({
    phone_number: Joi.string().required(),
    password: Joi.string().required()
  }),
  createBatch: Joi.object({
    crop_template_id: Joi.number().integer().required(),
    quantity: Joi.number().positive().required(),
    unit: Joi.string().valid('kg', 'bags', 'crates').required(),
    harvest_date: Joi.date().iso().required(),
    storage_conditions: Joi.object().optional()
  }),
  createListing: Joi.object({
    batch_id: Joi.string().uuid().required(),
    price_per_unit: Joi.number().positive().required(),
    currency: Joi.string().default('KES')
  }),
  createInquiry: Joi.object({
    listing_id: Joi.number().integer().required(),
    message: Joi.string().min(10).max(500).required()
  })
};

module.exports = {
  validate,
  schemas
};
