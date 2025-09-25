const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MarketplaceListing = sequelize.define('MarketplaceListing', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    batch_id: {
      type: DataTypes.UUID,
      references: {
        model: 'harvest_batches',
        key: 'id',
      },
    },
    price_per_unit: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    views_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    inquiries_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    listed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'marketplace_listings',
    timestamps: false,
  });

  MarketplaceListing.associate = (models) => {
    MarketplaceListing.belongsTo(models.HarvestBatch, { foreignKey: 'batch_id' });
    MarketplaceListing.hasMany(models.Inquiry, { foreignKey: 'listing_id' });
  };

  return MarketplaceListing;
};