const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CropTemplate = sequelize.define('CropTemplate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    spoilage_sensitivity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10,
      },
    },
    typical_shelf_life_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    storage_recommendations: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  }, {
    tableName: 'crop_templates',
    timestamps: false,
  });

  CropTemplate.associate = (models) => {
    CropTemplate.hasMany(models.HarvestBatch, { foreignKey: 'crop_template_id' });
  };

  return CropTemplate;
};