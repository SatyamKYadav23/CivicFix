const ALLOWED_ROLES = ['CITIZEN', 'WORKER', 'AUTHORITY', 'ADMIN'];
const ALLOWED_STATUSES = ['ACTIVE', 'INACTIVE', 'AVAILABLE', 'BUSY'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates request to GET /api/users/:id
 */
const validateGetUserById = (req) => {
  const errors = [];
  const { id } = req.params;

  if (!id || typeof id !== 'string' || id.trim() === '') {
    errors.push('User ID is required and must be a non-empty string.');
  } else if (id.length > 64) {
    errors.push('User ID exceeds maximum length of 64 characters.');
  }

  return errors;
};

/**
 * Validates query parameters for GET /api/users
 */
const validateGetUsersQuery = (req) => {
  const errors = [];
  const { role, status, page, limit } = req.query;

  if (role && !ALLOWED_ROLES.includes(role.toUpperCase())) {
    errors.push(`Invalid role '${role}'. Allowed roles: ${ALLOWED_ROLES.join(', ')}`);
  }

  if (status && !ALLOWED_STATUSES.includes(status.toUpperCase())) {
    errors.push(`Invalid status '${status}'. Allowed statuses: ${ALLOWED_STATUSES.join(', ')}`);
  }

  if (page !== undefined) {
    const pageNum = Number(page);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      errors.push('Page parameter must be a positive integer (>= 1).');
    }
  }

  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push('Limit parameter must be an integer between 1 and 100.');
    }
  }

  return errors;
};

/**
 * Validates body payload for POST /api/users
 */
const validateCreateUser = (req) => {
  const errors = [];
  const { name, email, password, role, phone } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters long.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters long.');
  }

  if (role && !ALLOWED_ROLES.includes(role.toUpperCase())) {
    errors.push(`Invalid role '${role}'. Allowed roles: ${ALLOWED_ROLES.join(', ')}`);
  }

  if (phone && (typeof phone !== 'string' || phone.trim().length > 20)) {
    errors.push('Phone number cannot exceed 20 characters.');
  }

  return errors;
};

module.exports = {
  ALLOWED_ROLES,
  ALLOWED_STATUSES,
  validateGetUserById,
  validateGetUsersQuery,
  validateCreateUser,
};

