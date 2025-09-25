const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HarvestBatch = sequelize.define('HarvestBatch', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    batch_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false, // CROP-YYMMDD-SEQ
    },
    farmer_id: {
      type: DataTypes.UUID,
      references: {
        model: 'farmers',
        key: 'user_id',
      },
    },
    crop_template_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'crop_templates',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    unit: {
      type: DataTypes.ENUM('kg', 'bags', 'crates'),
      allowNull: false,
    },
    harvest_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    storage_conditions: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    current_status: {
      type: DataTypes.ENUM('available', 'listed', 'sold', 'spoiled'),
      allowNull: false,
    },
    spoilage_risk_level: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    qr_code_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'harvest_batches',
    timestamps: false,
  });

  HarvestBatch.associate = (models) => {
    HarvestBatch.belongsTo(models.Farmer, { foreignKey: 'farmer_id' });
    HarvestBatch.belongsTo(models.CropTemplate, { foreignKey: 'crop_template_id' });
    HarvestBatch.hasOne(models.MarketplaceListing, { foreignKey: 'batch_id' });
  };

  return HarvestBatch;
};