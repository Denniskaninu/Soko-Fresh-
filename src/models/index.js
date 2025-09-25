const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
  }
);

const models = {
  User: require('./user.js')(sequelize, DataTypes),
  Farmer: require('./farmer.js')(sequelize, DataTypes),
  Buyer: require('./buyer')(sequelize, DataTypes),
  CropTemplate: require('./cropTemplate')(sequelize, DataTypes),
  HarvestBatch: require('./harvestBatch')(sequelize, DataTypes),
  MarketplaceListing: require('./marketplaceListing')(sequelize, DataTypes),
  Inquiry: require('./inquiry')(sequelize, DataTypes),
  Notification: require('./notification')(sequelize, DataTypes),
};

Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
