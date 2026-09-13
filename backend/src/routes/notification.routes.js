const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

// GET /api/notifications - List user's notifications
router.get('/', notificationController.getNotifications);

// PATCH /api/notifications/read-all - Mark all user notifications as read
router.patch('/read-all', notificationController.markAllAsRead);

// PATCH /api/notifications/:id/read - Mark specific notification as read
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;

