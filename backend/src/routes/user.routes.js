const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  validateGetUserById,
  validateGetUsersQuery,
  validateCreateUser,
} = require('../validators/user.validator');

const router = express.Router();

// GET /api/users - Retrieve users with filtering (Protected: ADMIN and AUTHORITY only)
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'AUTHORITY'),
  validate(validateGetUsersQuery),
  (req, res, next) => userController.getUsers(req, res, next)
);

// GET /api/users/:id - Retrieve user by ID (Protected: any authenticated user)
router.get(
  '/:id',
  authenticate,
  validate(validateGetUserById),
  (req, res, next) => userController.getUserById(req, res, next)
);

// POST /api/users - Administrative user creation (Protected: ADMIN only)
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(validateCreateUser),
  (req, res, next) => userController.createUser(req, res, next)
);

module.exports = router;
