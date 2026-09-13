const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware to handle unmatched routes (404)
 */
const notFoundHandler = (req, res, next) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, null, 404);
};

module.exports = notFoundHandler;

