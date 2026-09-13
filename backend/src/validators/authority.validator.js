const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^usr-[a-zA-Z0-9_-]+$/i;

const VALID_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
  'REJECTED',
  'CANCELLED',
];

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const VALID_CATEGORIES = [
  'ROADS_POTHOLES',
  'STREET_LIGHTS',
  'WATER_SUPPLY',
  'SANITATION_WASTE',
  'DRAINAGE_SEWAGE',
  'PARKS_PUBLIC_SPACES',
  'PUBLIC_TRANSPORT',
  'OTHER',
];

/**
 * Validates ID param in req.params.id
 */
const validateComplaintIdParam = (req) => {
  const errors = [];
  const { id } = req.params;

  if (!id || !UUID_REGEX.test(id)) {
    errors.push('A valid complaint ID (UUID) is required in the URL parameter.');
  }

  return errors;
};

/**
 * Validates status update payload
 * PATCH /api/authority/complaints/:id/status
 */
const validateUpdateStatus = (req) => {
  const errors = validateComplaintIdParam(req);
  const { status, notes } = req.body;

  if (!status || typeof status !== 'string') {
    errors.push('Status is required and must be a string.');
  } else if (!VALID_STATUSES.includes(status.trim().toUpperCase())) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      errors.push('Notes must be a string.');
    } else if (notes.length > 2000) {
      errors.push('Notes must not exceed 2000 characters.');
    }
  }

  return errors;
};

/**
 * Validates priority update payload
 * PATCH /api/authority/complaints/:id/priority
 */
const validateUpdatePriority = (req) => {
  const errors = validateComplaintIdParam(req);
  const { priority, notes } = req.body;

  if (!priority || typeof priority !== 'string') {
    errors.push('Priority is required and must be a string.');
  } else if (!VALID_PRIORITIES.includes(priority.trim().toUpperCase())) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      errors.push('Notes must be a string.');
    } else if (notes.length > 2000) {
      errors.push('Notes must not exceed 2000 characters.');
    }
  }

  return errors;
};

/**
 * Validates worker assignment payload
 * POST /api/authority/complaints/:id/assign-worker
 */
const validateAssignWorker = (req) => {
  const errors = validateComplaintIdParam(req);
  const { workerId, notes } = req.body;

  if (!workerId || typeof workerId !== 'string' || !UUID_REGEX.test(workerId.trim())) {
    errors.push('workerId is required and must be a valid UUID.');
  }

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      errors.push('Notes must be a string.');
    } else if (notes.length > 2000) {
      errors.push('Notes must not exceed 2000 characters.');
    }
  }

  return errors;
};

/**
 * Validates authority create worker payload
 * POST /api/authority/workers
 */
const validateAuthorityCreateWorker = (req) => {
  const errors = [];
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Technician name is required.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('A valid technician email address is required.');
  }

  if (password !== undefined && password !== null) {
    if (typeof password !== 'string' || password.trim().length < 6) {
      errors.push('Password must be at least 6 characters long.');
    }
  }

  return errors;
};

module.exports = {
  VALID_STATUSES,
  VALID_PRIORITIES,
  VALID_CATEGORIES,
  validateComplaintIdParam,
  validateUpdateStatus,
  validateUpdatePriority,
  validateAssignWorker,
  validateAuthorityCreateWorker,
};

