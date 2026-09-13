const { USER_ROLES } = {
  USER_ROLES: ['CITIZEN', 'WORKER', 'AUTHORITY', 'ADMIN'],
};

const ALLOWED_USER_STATUSES = ['ACTIVE', 'INACTIVE', 'AVAILABLE', 'BUSY'];

const ALLOWED_COMPLAINT_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLUTION_SUBMITTED',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
  'REJECTED',
  'CANCELLED',
];

const ALLOWED_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const validateUserStatusUpdate = (req) => {
  const errors = [];
  const { status } = req.body;

  if (!status || typeof status !== 'string') {
    errors.push('Status is required.');
  } else if (!ALLOWED_USER_STATUSES.includes(status.toUpperCase())) {
    errors.push(`Status must be one of: ${ALLOWED_USER_STATUSES.join(', ')}`);
  }

  return errors;
};

const validateUserRoleUpdate = (req) => {
  const errors = [];
  const { role } = req.body;

  if (!role || typeof role !== 'string') {
    errors.push('Role is required.');
  } else if (!USER_ROLES.includes(role.toUpperCase())) {
    errors.push(`Role must be one of: ${USER_ROLES.join(', ')}`);
  }

  return errors;
};

const validateAdminCreateUser = (req) => {
  const errors = [];
  const { name, email, password, role } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters long.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters long.');
  }

  if (!role || typeof role !== 'string' || !USER_ROLES.includes(role.toUpperCase())) {
    errors.push(`Role is required and must be one of: ${USER_ROLES.join(', ')}`);
  }

  return errors;
};

const validateAdminOverrideStatus = (req) => {
  const errors = [];
  const { status } = req.body;

  if (!status || typeof status !== 'string') {
    errors.push('Status is required.');
  } else if (!ALLOWED_COMPLAINT_STATUSES.includes(status.toUpperCase())) {
    errors.push(`Status must be one of: ${ALLOWED_COMPLAINT_STATUSES.join(', ')}`);
  }

  return errors;
};

const validateAdminOverridePriority = (req) => {
  const errors = [];
  const { priority } = req.body;

  if (!priority || typeof priority !== 'string') {
    errors.push('Priority is required.');
  } else if (!ALLOWED_PRIORITIES.includes(priority.toUpperCase())) {
    errors.push(`Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`);
  }

  return errors;
};

module.exports = {
  validateUserStatusUpdate,
  validateUserRoleUpdate,
  validateAdminCreateUser,
  validateAdminOverrideStatus,
  validateAdminOverridePriority,
  ALLOWED_USER_STATUSES,
  ALLOWED_COMPLAINT_STATUSES,
  ALLOWED_PRIORITIES,
};

