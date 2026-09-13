const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^[a-zA-Z0-9_-]{3,64}$/i;

const ALLOWED_WORKER_STATUS_INPUTS = [
  'ACCEPT',
  'ACCEPTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLUTION_SUBMITTED',
  'RESOLVED',
];

/**
 * Validate complaint UUID param
 */
const validateWorkerComplaintIdParam = (req) => {
  const errors = [];
  const { id } = req.params;

  if (!id || !UUID_REGEX.test(id)) {
    errors.push('A valid complaint ID (UUID) is required in the URL parameter.');
  }

  return errors;
};

/**
 * Validate status change by worker
 * PATCH /api/worker/complaints/:id/status
 */
const validateWorkerUpdateStatus = (req) => {
  const errors = validateWorkerComplaintIdParam(req);
  const { status, notes, materialsUsed } = req.body;

  if (!status || typeof status !== 'string') {
    errors.push('Status is required and must be a string.');
  } else {
    const norm = status.trim().toUpperCase();
    if (!ALLOWED_WORKER_STATUS_INPUTS.includes(norm)) {
      errors.push(`Status must be one of: ${ALLOWED_WORKER_STATUS_INPUTS.join(', ')}`);
    }

    if (norm === 'RESOLVED' && (!notes || typeof notes !== 'string' || notes.trim() === '')) {
      errors.push('Resolution notes are required when marking a complaint as RESOLVED.');
    }
  }

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      errors.push('Notes must be a string.');
    } else if (notes.length > 2000) {
      errors.push('Notes cannot exceed 2000 characters.');
    }
  }

  if (materialsUsed !== undefined && materialsUsed !== null) {
    if (typeof materialsUsed !== 'string') {
      errors.push('materialsUsed must be a string.');
    } else if (materialsUsed.length > 255) {
      errors.push('materialsUsed cannot exceed 255 characters.');
    }
  }

  return errors;
};

/**
 * Validate work update notes
 * POST /api/worker/complaints/:id/update
 */
const validateWorkUpdate = (req) => {
  const errors = validateWorkerComplaintIdParam(req);
  const { notes, materialsUsed, updateType } = req.body;

  if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
    errors.push('Progress notes are required.');
  } else if (notes.length > 2000) {
    errors.push('Progress notes cannot exceed 2000 characters.');
  }

  if (materialsUsed !== undefined && materialsUsed !== null) {
    if (typeof materialsUsed !== 'string') {
      errors.push('materialsUsed must be a string.');
    } else if (materialsUsed.length > 255) {
      errors.push('materialsUsed cannot exceed 255 characters.');
    }
  }

  if (updateType) {
    const validTypes = ['NOTE', 'PROGRESS', 'EVIDENCE', 'COMPLETION'];
    if (!validTypes.includes(updateType.toUpperCase())) {
      errors.push(`updateType must be one of: ${validTypes.join(', ')}`);
    }
  }

  return errors;
};

/**
 * Validate resolution evidence upload
 * POST /api/worker/complaints/:id/evidence
 */
const validateWorkerEvidence = (req) => {
  const errors = validateWorkerComplaintIdParam(req);
  const { notes, imageUrl } = req.body;

  if (!req.file && (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '')) {
    errors.push('An evidence image file or imageUrl is required.');
  }

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      errors.push('Notes must be a string.');
    } else if (notes.length > 2000) {
      errors.push('Notes cannot exceed 2000 characters.');
    }
  }

  return errors;
};

module.exports = {
  validateWorkerComplaintIdParam,
  validateWorkerUpdateStatus,
  validateWorkUpdate,
  validateWorkerEvidence,
};

