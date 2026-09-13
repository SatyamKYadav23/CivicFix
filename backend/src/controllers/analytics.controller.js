const analyticsService = require('../services/analytics.service');
const { successResponse } = require('../utils/apiResponse');

/**
 * Analytics Controller - Handles dashboard statistical requests
 */
class AnalyticsController {
  /**
   * GET /api/analytics/dashboard
   * Universal dashboard endpoint that automatically routes to the appropriate role metrics
   */
  async getDashboard(req, res, next) {
    try {
      const data = await analyticsService.getDashboard(req.user, req.query);
      return successResponse(res, 'Dashboard statistics retrieved successfully', data, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/citizen
   * Citizen-specific grievance metrics
   */
  async getCitizenAnalytics(req, res, next) {
    try {
      const data = await analyticsService.getCitizenDashboard(req.user);
      return successResponse(res, 'Citizen analytics retrieved successfully', data, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/authority
   * Department authority operational metrics & triage statistics
   */
  async getAuthorityAnalytics(req, res, next) {
    try {
      const data = await analyticsService.getAuthorityDashboard(req.user, req.query);
      return successResponse(res, 'Authority operational analytics retrieved successfully', data, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/worker
   * Field technician workload & task completion metrics
   */
  async getWorkerAnalytics(req, res, next) {
    try {
      const data = await analyticsService.getWorkerDashboard(req.user);
      return successResponse(res, 'Worker workload analytics retrieved successfully', data, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/admin
   * Platform-wide administrative governance analytics & time series
   */
  async getAdminAnalytics(req, res, next) {
    try {
      const data = await analyticsService.getAdminDashboard(req.query);
      return successResponse(res, 'Platform administrative analytics retrieved successfully', data, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();

