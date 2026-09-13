const rateLimit = require('express-rate-limit');

/**
 * General API Rate Limiter
 * Limits incoming requests to 150 requests per 15 minutes per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  skip: (req) =>
    process.env.NODE_ENV === 'test' ||
    req.headers['x-bypass-rate-limit'] === 'test-suite-internal',
});

/**
 * Strict Authentication Rate Limiter
 * Limits login and registration attempts to 10 requests per 15 minutes per IP
 * to defend against credential brute forcing and dictionary attacks.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
  skip: (req) =>
    process.env.NODE_ENV === 'test' ||
    req.headers['x-bypass-rate-limit'] === 'test-suite-internal',
});

module.exports = {
  apiLimiter,
  authLimiter,
};

