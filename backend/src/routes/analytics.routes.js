const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All analytics endpoints require valid JWT authentication
router.use(authenticate);

// Universal smart dashboard (routes dynamically according to JWT role)
router.get('/dashboard', (req, res, next) => analyticsController.getDashboard(req, res, next));
router.get('/me', (req, res, next) => analyticsController.getDashboard(req, res, next));

// Citizen-specific grievance analytics
router.get('/citizen', authorize('CITIZEN', 'ADMIN'), (req, res, next) =>
  analyticsController.getCitizenAnalytics(req, res, next)
);

// Department authority triage & operational analytics
router.get('/authority', authorize('AUTHORITY', 'ADMIN'), (req, res, next) =>
  analyticsController.getAuthorityAnalytics(req, res, next)
);

// Field technician workload analytics
router.get('/worker', authorize('WORKER', 'ADMIN'), (req, res, next) =>
  analyticsController.getWorkerAnalytics(req, res, next)
);

// System-wide administrative governance analytics & time series
router.get('/admin', authorize('ADMIN'), (req, res, next) =>
  analyticsController.getAdminAnalytics(req, res, next)
);

module.exports = router;

