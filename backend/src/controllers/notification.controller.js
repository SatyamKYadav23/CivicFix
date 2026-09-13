const notificationService = require('../services/notification.service');
const { successResponse } = require('../utils/apiResponse');

/**
 * Notification Controller - Handles in-app notifications
 */
class NotificationController {
  /**
   * GET /api/notifications
   */
  async getNotifications(req, res, next) {
    try {
      const result = await notificationService.getUserNotifications(req.user.id, req.query);
      return successResponse(res, 'Notifications retrieved successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(req, res, next) {
    try {
      const data = await notificationService.markAsRead(req.user.id, req.params.id);
      return successResponse(res, 'Notification marked as read', data, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/read-all
   */
  async markAllAsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user.id);
      return successResponse(res, 'All notifications marked as read', null, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();

