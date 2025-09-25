const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Buyer = sequelize.define('Buyer', {
    user_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    business_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    business_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    buying_capacity: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    preferred_crops: {
      type: DataTypes.JSON,
      allowNull: true, // JSON array
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  }, {
    tableName: 'buyers',
    timestamps: false,
  });

  Buyer.associate = (models) => {
    Buyer.belongsTo(models.User, { foreignKey: 'user_id' });
    Buyer.hasMany(models.Inquiry, { foreignKey: 'buyer_id' });
  };

  return Buyer;
};