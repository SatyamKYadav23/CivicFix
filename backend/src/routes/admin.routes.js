const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  validateUserStatusUpdate,
  validateUserRoleUpdate,
  validateAdminCreateUser,
  validateAdminOverrideStatus,
  validateAdminOverridePriority,
} = require('../validators/admin.validator');

const router = express.Router();

// Strict security: All administrative routes require JWT authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

const analyticsController = require('../controllers/analytics.controller');

// =========================================================================
// SYSTEM ANALYTICS & AUDIT LOGS
// =========================================================================
router.get('/stats', (req, res, next) => adminController.getStats(req, res, next));
router.get('/analytics', (req, res, next) => analyticsController.getAdminAnalytics(req, res, next));
router.get('/audit-logs', (req, res, next) => adminController.getAuditLogs(req, res, next));
router.get('/departments', (req, res, next) => adminController.getDepartments(req, res, next));

// =========================================================================
// USER MANAGEMENT
// =========================================================================
router.get('/users', (req, res, next) => adminController.listUsers(req, res, next));
router.post('/users', validate(validateAdminCreateUser), (req, res, next) =>
  adminController.createUser(req, res, next)
);
router.get('/users/:id', (req, res, next) => adminController.getUserById(req, res, next));
router.patch('/users/:id/status', validate(validateUserStatusUpdate), (req, res, next) =>
  adminController.updateUserStatus(req, res, next)
);
router.patch('/users/:id/role', validate(validateUserRoleUpdate), (req, res, next) =>
  adminController.updateUserRole(req, res, next)
);

// =========================================================================
// COMPLAINT MANAGEMENT
// =========================================================================
router.get('/complaints', (req, res, next) => adminController.listComplaints(req, res, next));
router.get('/complaints/:id', (req, res, next) => adminController.getComplaintDetails(req, res, next));
router.get('/complaints/:id/history', (req, res, next) => adminController.getComplaintHistory(req, res, next));
router.patch('/complaints/:id/status', validate(validateAdminOverrideStatus), (req, res, next) =>
  adminController.overrideComplaintStatus(req, res, next)
);
router.patch('/complaints/:id/priority', validate(validateAdminOverridePriority), (req, res, next) =>
  adminController.overrideComplaintPriority(req, res, next)
);
router.delete('/complaints/:id', (req, res, next) => adminController.deleteComplaint(req, res, next));

// =========================================================================
// WORKER MANAGEMENT
// =========================================================================
router.get('/workers', (req, res, next) => adminController.listWorkers(req, res, next));
router.patch('/workers/:id/status', (req, res, next) => adminController.updateWorkerStatus(req, res, next));
router.put('/workers/:id/profile', (req, res, next) => adminController.updateWorkerProfile(req, res, next));

// =========================================================================
// AUTHORITY MANAGEMENT
// =========================================================================
router.get('/authorities', (req, res, next) => adminController.listAuthorities(req, res, next));
router.patch('/authorities/:id/department', (req, res, next) =>
  adminController.updateAuthorityJurisdiction(req, res, next)
);

module.exports = router;
