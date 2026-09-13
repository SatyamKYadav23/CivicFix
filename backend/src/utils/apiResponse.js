/**
 * Standardized API success response
 * Automatically elevates pagination metadata to the root level if present in data or passed as an argument
 */
const successResponse = (res, message, data = null, statusCode = 200, pagination = null) => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  if (pagination) {
    response.pagination = pagination;
  } else if (data && typeof data === 'object' && !Array.isArray(data) && data.pagination) {
    response.pagination = data.pagination;
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const listKey = ['complaints', 'users', 'workers', 'authorities', 'notifications', 'logs'].find(
      (k) => Array.isArray(data[k])
    );
    if (listKey && !data.items) {
      data.items = data[listKey];
    }
  }

  return res.status(statusCode).json(response);
};

/**
 * Standardized API error response
 */
const errorResponse = (res, message, errors = null, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  successResponse,
  errorResponse,
};

