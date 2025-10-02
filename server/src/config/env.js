require('dotenv').config();

const config = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-lite',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-key',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  STEADFAST_API_KEY: process.env.STEADFAST_API_KEY || '',
  STEADFAST_SECRET_KEY: process.env.STEADFAST_SECRET_KEY || '',
  STEADFAST_BASE_URL: process.env.STEADFAST_BASE_URL || 'https://portal.packzy.com/api/v1'
};

module.exports = config;

