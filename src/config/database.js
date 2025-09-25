require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DATABASE_USER || 'postgres',
    password: String(process.env.DATABASE_PASSWORD || 'lisp.prime'), // force string
    database: process.env.DATABASE_NAME || 'GREEN_TRUST',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432),
    dialect: 'postgres',
    logging: false,
  },
  test: {
    username: process.env.DATABASE_USER || 'postgres',
    password: String(process.env.DATABASE_PASSWORD || 'lisp.prime'),
    database: process.env.DATABASE_NAME || 'GREEN_TRUST',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432),
    dialect: 'postgres',
    logging: false,
  },
  production: {
    username: process.env.DATABASE_USER,
    password: String(process.env.DATABASE_PASSWORD),
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    dialect: 'postgres',
    logging: false,
  },
};
