const authorityService = require('../services/authority.service');
const { successResponse } = require('../utils/apiResponse');

/**
 * Authority Controller - HTTP Layer for Authority operations
 */
class AuthorityController {
  /**
   * GET /api/authority/complaints
   */
  async getComplaints(req, res, next) {
    try {
      const result = await authorityService.getComplaints(req.user, req.query);
      return successResponse(res, 'Complaints retrieved successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/authority/complaints/:id
   */
  async getComplaintById(req, res, next) {
    try {
      const complaint = await authorityService.getComplaintById(req.user, req.params.id);
      return successResponse(res, 'Complaint details retrieved successfully', complaint, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/authority/complaints/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      const updated = await authorityService.updateStatus(req.user, req.params.id, req.body);
      return successResponse(res, 'Complaint status updated successfully', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/authority/complaints/:id/priority
   */
  async updatePriority(req, res, next) {
    try {
      const updated = await authorityService.updatePriority(req.user, req.params.id, req.body);
      return successResponse(res, 'Complaint priority updated successfully', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/authority/complaints/:id/assign-worker
   */
  async assignWorker(req, res, next) {
    try {
      const updated = await authorityService.assignWorker(req.user, req.params.id, req.body);
      return successResponse(res, 'Worker assigned successfully', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/authority/workers
   */
  async getWorkers(req, res, next) {
    try {
      const workers = await authorityService.getWorkers(req.user, req.query);
      return successResponse(res, 'Workers retrieved successfully', workers, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/authority/workers
   */
  async createWorker(req, res, next) {
    try {
      const created = await authorityService.createWorker(req.user, req.body);
      return successResponse(res, 'Technician registered successfully under your department', created, 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthorityController();

