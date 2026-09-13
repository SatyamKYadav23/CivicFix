const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates registration request payload
 * POST /api/auth/register
 */
const validateRegister = (req) => {
  const errors = [];
  const { name, email, password, phone, address } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters long.');
  } else if (name.trim().length > 100) {
    errors.push('Name cannot exceed 100 characters.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  } else if (email.trim().length > 191) {
    errors.push('Email cannot exceed 191 characters.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters long.');
  } else if (password.length > 100) {
    errors.push('Password cannot exceed 100 characters.');
  }

  if (phone && (typeof phone !== 'string' || phone.trim().length > 20)) {
    errors.push('Phone number cannot exceed 20 characters.');
  }

  if (address && (typeof address !== 'string' || address.trim().length > 255)) {
    errors.push('Address cannot exceed 255 characters.');
  }

  return errors;
};

/**
 * Validates login request payload
 * POST /api/auth/login
 */
const validateLogin = (req) => {
  const errors = [];
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.trim() === '') {
    errors.push('Password is required.');
  }

  return errors;
};

module.exports = {
  validateRegister,
  validateLogin,
};

