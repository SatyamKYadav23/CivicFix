const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'civicfix_default_jwt_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

if (config.nodeEnv === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'civicfix_default_jwt_secret')) {
  console.warn('[SECURITY WARNING] Insecure default JWT_SECRET detected in production environment! Configure a strong secret in .env.');
}

module.exports = config;

