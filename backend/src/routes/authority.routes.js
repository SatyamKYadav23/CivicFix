const express = require('express');
const authorityController = require('../controllers/authority.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  validateComplaintIdParam,
  validateUpdateStatus,
  validateUpdatePriority,
  validateAssignWorker,
  validateAuthorityCreateWorker,
} = require('../validators/authority.validator');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router();

// Enforce authentication and role-based access for all authority routes
router.use(authenticate);
router.use(authorize('AUTHORITY', 'ADMIN'));

/**
 * @route   GET /api/authority/analytics (and /api/authority/stats)
 * @desc    Get operational triage metrics, resolution times, and department stats
 * @access  Private (AUTHORITY, ADMIN)
 */
router.get('/analytics', (req, res, next) => analyticsController.getAuthorityAnalytics(req, res, next));
router.get('/stats', (req, res, next) => analyticsController.getAuthorityAnalytics(req, res, next));

/**
 * @route   GET /api/authority/workers
 * @desc    Retrieve list of active workers available for dispatch
 * @access  Private (AUTHORITY, ADMIN)
 */
router.get('/workers', authorityController.getWorkers);

/**
 * @route   POST /api/authority/workers
 * @desc    Register a new technician under this authority's department
 * @access  Private (AUTHORITY, ADMIN)
 */
router.post(
  '/workers',
  validate(validateAuthorityCreateWorker),
  authorityController.createWorker
);

/**
 * @route   GET /api/authority/complaints
 * @desc    Retrieve complaints within jurisdiction, with filters, search, and pagination
 * @access  Private (AUTHORITY, ADMIN)
 */
router.get('/complaints', authorityController.getComplaints);

/**
 * @route   GET /api/authority/complaints/:id
 * @desc    Get detailed complaint record including complete audit timeline
 * @access  Private (AUTHORITY, ADMIN)
 */
router.get(
  '/complaints/:id',
  validate(validateComplaintIdParam),
  authorityController.getComplaintById
);

/**
 * @route   PATCH /api/authority/complaints/:id/status
 * @desc    Update complaint status and record audit log
 * @access  Private (AUTHORITY, ADMIN)
 */
router.patch(
  '/complaints/:id/status',
  validate(validateUpdateStatus),
  authorityController.updateStatus
);

/**
 * @route   PATCH /api/authority/complaints/:id/priority
 * @desc    Escalate or adjust complaint priority and record audit log
 * @access  Private (AUTHORITY, ADMIN)
 */
router.patch(
  '/complaints/:id/priority',
  validate(validateUpdatePriority),
  authorityController.updatePriority
);

/**
 * @route   POST /api/authority/complaints/:id/assign-worker
 * @desc    Assign field worker to complaint and transition status to ASSIGNED
 * @access  Private (AUTHORITY, ADMIN)
 */
router.post(
  ['/complaints/:id/assign', '/complaints/:id/assign-worker'],
  validate(validateAssignWorker),
  authorityController.assignWorker
);


module.exports = router;
