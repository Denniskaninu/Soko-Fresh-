const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Inquiry = sequelize.define('Inquiry', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    buyer_id: {
      type: DataTypes.UUID,
      references: {
        model: 'buyers',
        key: 'user_id',
      },
    },
    listing_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'marketplace_listings',
        key: 'id',
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'responded', 'closed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'inquiries',
    timestamps: false,
  });

  Inquiry.associate = (models) => {
    Inquiry.belongsTo(models.Buyer, { foreignKey: 'buyer_id' });
    Inquiry.belongsTo(models.MarketplaceListing, { foreignKey: 'listing_id' });
  };

  return Inquiry;
};