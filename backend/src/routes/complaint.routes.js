const express = require('express');
const complaintController = require('../controllers/complaint.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadEvidence } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');
const {
  validateCreateComplaint,
  validateUpdateComplaint,
  validateGetComplaintsQuery,
} = require('../validators/complaint.validator');
const { validateFeedback } = require('../validators/feedback.validator');

const router = express.Router();

// All complaint routes require authentication
router.use(authenticate);

// POST /api/complaints - Report a complaint (supports multipart/form-data with evidence upload)
router.post('/', uploadEvidence, validate(validateCreateComplaint), (req, res, next) =>
  complaintController.createComplaint(req, res, next)
);

// GET /api/complaints - List complaints (scoped by role with filters & pagination)
router.get('/', validate(validateGetComplaintsQuery), (req, res, next) =>
  complaintController.getComplaints(req, res, next)
);

// GET /api/complaints/:id/history - Get chronological audit timeline
router.get('/:id/history', (req, res, next) =>
  complaintController.getComplaintTimeline(req, res, next)
);

// GET /api/complaints/:id/timeline - Alias for /history
router.get('/:id/timeline', (req, res, next) =>
  complaintController.getComplaintTimeline(req, res, next)
);

// POST /api/complaints/:id/feedback - Submit citizen satisfaction feedback
router.post('/:id/feedback', validate(validateFeedback), (req, res, next) =>
  complaintController.submitFeedback(req, res, next)
);

// GET /api/complaints/:id - Get complaint by ID
router.get('/:id', (req, res, next) =>
  complaintController.getComplaintById(req, res, next)
);

// PUT /api/complaints/:id - Update complaint details/status (supports evidence upload)
router.put('/:id', uploadEvidence, validate(validateUpdateComplaint), (req, res, next) =>
  complaintController.updateComplaint(req, res, next)
);

// DELETE /api/complaints/:id - Delete or cancel complaint
router.delete('/:id', (req, res, next) =>
  complaintController.deleteComplaint(req, res, next)
);

module.exports = router;


