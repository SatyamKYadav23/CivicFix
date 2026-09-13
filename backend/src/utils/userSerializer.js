/**
 * Strips password and sensitive fields from a user object
 * Ensures passwords NEVER leak through API responses
 */
const sanitizeUser = (user) => {
  if (!user) return null;

  // Clone to avoid mutating original object
  const userObj = { ...user };
  delete userObj.password;

  return userObj;
};

/**
 * Strips passwords from an array of user objects
 */
const sanitizeUsers = (users) => {
  if (!Array.isArray(users)) return [];
  return users.map((user) => sanitizeUser(user));
};

module.exports = {
  sanitizeUser,
  sanitizeUsers,
};

