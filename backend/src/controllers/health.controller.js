const { successResponse } = require('../utils/apiResponse');
const config = require('../config/env');

/**
 * Health check controller
 * GET /api/health
 */
const getHealthStatus = (req, res) => {
  const healthData = {
    status: 'healthy',
    service: 'CivicFix Backend API',
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.nodeEnv,
    version: '1.0.0',
  };

  return successResponse(res, 'CivicFix Backend API is running successfully', healthData, 200);
};

module.exports = {
  getHealthStatus,
};

