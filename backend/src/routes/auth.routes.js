const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { validateRegister, validateLogin } = require('../validators/auth.validator');
const { authLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

// POST /api/auth/register - Register Citizen
router.post('/register', authLimiter, validate(validateRegister), (req, res, next) =>
  authController.register(req, res, next)
);

// POST /api/auth/login - Log in with email & password
router.post('/login', authLimiter, validate(validateLogin), (req, res, next) =>
  authController.login(req, res, next)
);

// POST /api/auth/logout - Log out session
router.post('/logout', (req, res, next) =>
  authController.logout(req, res, next)
);

// GET /api/auth/me - Protected current user profile
router.get('/me', authenticate, (req, res, next) =>
  authController.getMe(req, res, next)
);

module.exports = router;

