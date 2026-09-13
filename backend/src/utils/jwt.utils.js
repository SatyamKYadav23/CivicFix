const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Generates a signed JWT with minimal claims (id, email, role)
 * @param {object} user - User object
 * @returns {string} Signed JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    algorithm: 'HS256',
  });
};

/**
 * Verifies a JWT token and returns decoded claims
 * @param {string} token - JWT token string
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret, {
    algorithms: ['HS256'],
  });
};

module.exports = {
  generateToken,
  verifyToken,
};

