const express = require('express');
const workerController = require('../controllers/worker.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadEvidence } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');
const {
  validateWorkerComplaintIdParam,
  validateWorkerUpdateStatus,
  validateWorkUpdate,
  validateWorkerEvidence,
} = require('../validators/worker.validator');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router();

// Enforce authentication and role-based access for worker endpoints
router.use(authenticate);
router.use(authorize('WORKER', 'ADMIN'));

/**
 * @route   GET /api/worker/analytics (and /api/worker/stats)
 * @desc    Retrieve workload, task completion, and active metrics for worker
 * @access  Private (WORKER, ADMIN)
 */
router.get('/analytics', (req, res, next) => analyticsController.getWorkerAnalytics(req, res, next));
router.get('/stats', (req, res, next) => analyticsController.getWorkerAnalytics(req, res, next));

/**
 * @route   GET /api/worker/complaints
 * @desc    Retrieve tasks assigned to the authenticated worker
 * @access  Private (WORKER, ADMIN)
 */
router.get('/complaints', workerController.getComplaints);

/**
 * @route   GET /api/worker/complaints/:id
 * @desc    Get detailed task record for assigned worker
 * @access  Private (WORKER, ADMIN)
 */
router.get(
  '/complaints/:id',
  validate(validateWorkerComplaintIdParam),
  workerController.getComplaintById
);

/**
 * @route   PATCH /api/worker/complaints/:id/status
 * @desc    Update task status (ACCEPT, IN_PROGRESS, RESOLVED)
 * @access  Private (WORKER, ADMIN)
 */
router.patch(
  '/complaints/:id/status',
  validate(validateWorkerUpdateStatus),
  workerController.updateStatus
);

/**
 * @route   POST /api/worker/complaints/:id/update
 * @desc    Log progress update or materials used checkpoint
 * @access  Private (WORKER, ADMIN)
 */
router.post(
  '/complaints/:id/update',
  validate(validateWorkUpdate),
  workerController.addWorkUpdate
);

/**
 * @route   POST /api/worker/complaints/:id/evidence
 * @desc    Upload resolution photographic evidence
 * @access  Private (WORKER, ADMIN)
 */
router.post(
  '/complaints/:id/evidence',
  uploadEvidence,
  validate(validateWorkerEvidence),
  workerController.uploadEvidence
);

module.exports = router;

