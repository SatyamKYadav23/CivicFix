const ALLOWED_CATEGORIES = [
  'ROADS_POTHOLES',
  'STREET_LIGHTS',
  'WATER_SUPPLY',
  'SANITATION_WASTE',
  'DRAINAGE_SEWAGE',
  'PARKS_PUBLIC_SPACES',
  'PUBLIC_TRANSPORT',
  'OTHER',
];

const ALLOWED_STATUSES = [
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

const ALLOWED_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'priority', 'status', 'title'];

/**
 * Validates request payload for creating a complaint
 * POST /api/complaints
 */
const validateCreateComplaint = (req) => {
  const errors = [];
  const { title, description, category, location, latitude, longitude, priority, imageUrl } =
    req.body;

  if (!title || typeof title !== 'string' || title.trim().length < 5) {
    errors.push('Title is required and must be at least 5 characters long.');
  } else if (title.trim().length > 200) {
    errors.push('Title cannot exceed 200 characters.');
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    errors.push('Description is required and must be at least 10 characters long.');
  }

  if (!category || typeof category !== 'string' || !ALLOWED_CATEGORIES.includes(category.toUpperCase())) {
    errors.push(
      `Category is required and must be one of: ${ALLOWED_CATEGORIES.join(', ')}`
    );
  }

  if (!location || typeof location !== 'string' || location.trim().length < 3) {
    errors.push('Location is required and must be at least 3 characters long.');
  } else if (location.trim().length > 255) {
    errors.push('Location cannot exceed 255 characters.');
  }

  if (priority && !ALLOWED_PRIORITIES.includes(priority.toUpperCase())) {
    errors.push(`Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`);
  }

  if (latitude !== undefined && latitude !== null && `${latitude}`.trim() !== '') {
    const lat = Number(latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Latitude must be a valid number between -90 and 90 degrees.');
    }
  }

  if (longitude !== undefined && longitude !== null && `${longitude}`.trim() !== '') {
    const lng = Number(longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push('Longitude must be a valid number between -180 and 180 degrees.');
    }
  }

  if (imageUrl && (typeof imageUrl !== 'string' || imageUrl.trim().length > 500)) {
    errors.push('Image URL cannot exceed 500 characters.');
  }

  return errors;
};

/**
 * Validates request payload for updating a complaint
 * PUT /api/complaints/:id
 */
const validateUpdateComplaint = (req) => {
  const errors = [];
  const { title, description, category, location, priority, status, latitude, longitude, imageUrl } =
    req.body;

  const hasFile = Boolean(req.file);

  if (
    !hasFile &&
    title === undefined &&
    description === undefined &&
    category === undefined &&
    location === undefined &&
    priority === undefined &&
    status === undefined &&
    latitude === undefined &&
    longitude === undefined &&
    imageUrl === undefined &&
    req.body.assignedWorkerId === undefined &&
    req.body.assignedAuthorityId === undefined
  ) {
    errors.push('At least one field or evidence image must be provided for update.');
  }

  if (title !== undefined && (typeof title !== 'string' || title.trim().length < 5)) {
    errors.push('Title must be at least 5 characters long.');
  }

  if (description !== undefined && (typeof description !== 'string' || description.trim().length < 10)) {
    errors.push('Description must be at least 10 characters long.');
  }

  if (category !== undefined && !ALLOWED_CATEGORIES.includes(category.toUpperCase())) {
    errors.push(`Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);
  }

  if (priority !== undefined && !ALLOWED_PRIORITIES.includes(priority.toUpperCase())) {
    errors.push(`Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`);
  }

  if (status !== undefined && !ALLOWED_STATUSES.includes(status.toUpperCase())) {
    errors.push(`Status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
  }

  if (latitude !== undefined && latitude !== null && `${latitude}`.trim() !== '') {
    const lat = Number(latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Latitude must be a valid number between -90 and 90 degrees.');
    }
  }

  if (longitude !== undefined && longitude !== null && `${longitude}`.trim() !== '') {
    const lng = Number(longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push('Longitude must be a valid number between -180 and 180 degrees.');
    }
  }

  return errors;
};

/**
const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'priority',
  'status',
  'title',
  'category',
];

/**
 * Validates query parameters for listing complaints
 * GET /api/complaints
 */
const validateGetComplaintsQuery = (req) => {
  const errors = [];
  const {
    category,
    status,
    priority,
    page,
    limit,
    sortBy,
    sort,
    order,
    sortOrder,
    startDate,
    endDate,
    from,
    to,
  } = req.query;

  if (category) {
    const cats = String(category).split(',').map((c) => c.trim().toUpperCase());
    const invalid = cats.filter((c) => !ALLOWED_CATEGORIES.includes(c));
    if (invalid.length > 0) {
      errors.push(`Invalid category '${invalid.join(', ')}'. Allowed: ${ALLOWED_CATEGORIES.join(', ')}`);
    }
  }

  if (status) {
    const stats = String(status).split(',').map((s) => s.trim().toUpperCase());
    const invalid = stats.filter((s) => !ALLOWED_STATUSES.includes(s));
    if (invalid.length > 0) {
      errors.push(`Invalid status '${invalid.join(', ')}'. Allowed: ${ALLOWED_STATUSES.join(', ')}`);
    }
  }

  if (priority) {
    const prios = String(priority).split(',').map((p) => p.trim().toUpperCase());
    const invalid = prios.filter((p) => !ALLOWED_PRIORITIES.includes(p));
    if (invalid.length > 0) {
      errors.push(`Invalid priority '${invalid.join(', ')}'. Allowed: ${ALLOWED_PRIORITIES.join(', ')}`);
    }
  }

  if (page !== undefined) {
    const p = Number(page);
    if (!Number.isInteger(p) || p < 1) {
      errors.push('Page must be a positive integer.');
    }
  }

  if (limit !== undefined) {
    const l = Number(limit);
    if (!Number.isInteger(l) || l < 1 || l > 100) {
      errors.push('Limit must be an integer between 1 and 100.');
    }
  }

  const requestedSort = sortBy || sort;
  if (requestedSort && !ALLOWED_SORT_FIELDS.includes(requestedSort)) {
    errors.push(`sortBy must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}`);
  }

  const requestedOrder = sortOrder || order;
  if (requestedOrder && !['asc', 'desc'].includes(requestedOrder.toLowerCase())) {
    errors.push("sortOrder must be either 'asc' or 'desc'.");
  }

  const startVal = startDate || from;
  if (startVal && isNaN(Date.parse(startVal))) {
    errors.push('startDate must be a valid date string.');
  }

  const endVal = endDate || to;
  if (endVal && isNaN(Date.parse(endVal))) {
    errors.push('endDate must be a valid date string.');
  }

  return errors;
};

module.exports = {
  ALLOWED_CATEGORIES,
  ALLOWED_STATUSES,
  ALLOWED_PRIORITIES,
  validateCreateComplaint,
  validateUpdateComplaint,
  validateGetComplaintsQuery,
};

