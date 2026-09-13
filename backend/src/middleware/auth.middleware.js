const { verifyToken } = require('../utils/jwt.utils');
const userRepository = require('../repositories/user.repository');
const { sanitizeUser } = require('../utils/userSerializer');
const AppError = require('../utils/appError');

/**
 * Middleware to authenticate requests using JWT
 * Extracts Bearer token, verifies it, fetches user from DB, and attaches to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please provide a valid Bearer token.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token || token.trim() === '') {
      throw new AppError('Authentication token is missing.', 401);
    }

    // Verify token signature and expiration
    const decoded = verifyToken(token);

    // Retrieve active user from database (never trust token alone)
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new AppError('The user belonging to this token no longer exists.', 401);
    }

    // Check account status
    if (user.status === 'INACTIVE') {
      throw new AppError('Your account is currently inactive. Please contact administration.', 403);
    }

    // Attach sanitized user to request object
    req.user = sanitizeUser(user);
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware factory for Role-Based Access Control (RBAC)
 * @param {...string} allowedRoles - List of allowed roles (e.g., 'ADMIN', 'AUTHORITY')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    // Always obtain authorization from verified req.user.role (never from request body/headers)
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Role '${req.user.role}' does not have permission to perform this action.`,
          403
        )
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};

