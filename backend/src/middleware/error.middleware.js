const { errorResponse } = require('../utils/apiResponse');
const config = require('../config/env');

/**
 * Centralized error handling middleware
 * Handles standard Errors, custom AppErrors, and Prisma exceptions
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Handle Prisma Known Request Errors
  if (err.code === 'P2002') {
    // Unique constraint violation
    const targetField = err.meta && err.meta.target ? err.meta.target : 'field';
    statusCode = 409;
    message = `A record with this ${targetField} already exists.`;
  } else if (err.code === 'P2025') {
    // Record not found in Prisma query
    statusCode = 404;
    message = 'Requested record was not found.';
  } else if (err.code === 'P2003') {
    // Foreign key constraint failed
    statusCode = 400;
    message = 'Invalid reference: related entity does not exist.';
  } else if (err.name === 'JsonWebTokenError') {
    // Malformed or invalid signature JWT
    statusCode = 401;
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    // Expired JWT
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  } else if (err.name === 'MulterError') {
    // File upload errors
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds maximum allowed limit of 5MB.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field. Please upload under "image" or "evidence".';
    } else {
      message = err.message || 'File upload error.';
    }
  }

  // Log server-side errors in development or 500s
  if (statusCode >= 500 || config.nodeEnv === 'development') {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  // Prevent information disclosure in production
  if (statusCode >= 500 && config.nodeEnv === 'production') {
    message = 'An unexpected internal server error occurred. Please contact support.';
    errors = null;
  }

  const errorPayload = {
    ...(errors && { details: errors }),
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  };

  return errorResponse(
    res,
    message,
    Object.keys(errorPayload).length > 0 ? errorPayload : null,
    statusCode
  );
};

module.exports = errorHandler;
