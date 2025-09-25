const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Farmer = sequelize.define('Farmer', {
    user_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    farm_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    farm_size: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    primary_crops: {
      type: DataTypes.JSON,
      allowNull: true, // JSON array
    },
    certification_level: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  }, {
    tableName: 'farmers',
    timestamps: false,
  });

  Farmer.associate = (models) => {
    Farmer.belongsTo(models.User, { foreignKey: 'user_id' });
    Farmer.hasMany(models.HarvestBatch, { foreignKey: 'farmer_id' });
  };

  return Farmer;
};