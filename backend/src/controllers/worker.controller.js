const workerService = require('../services/worker.service');
const { successResponse } = require('../utils/apiResponse');

/**
 * Worker Controller - Handles HTTP requests for field workers
 */
class WorkerController {
  /**
   * GET /api/worker/complaints
   */
  async getComplaints(req, res, next) {
    try {
      const result = await workerService.getAssignedComplaints(req.user, req.query);
      return successResponse(res, 'Assigned tasks retrieved successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/worker/complaints/:id
   */
  async getComplaintById(req, res, next) {
    try {
      const complaint = await workerService.getComplaintById(req.user, req.params.id);
      return successResponse(res, 'Task details retrieved successfully', complaint, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/worker/complaints/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      const updated = await workerService.updateStatus(req.user, req.params.id, req.body);
      return successResponse(res, 'Task status updated successfully', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/worker/complaints/:id/update
   */
  async addWorkUpdate(req, res, next) {
    try {
      const result = await workerService.addWorkUpdate(req.user, req.params.id, req.body);
      return successResponse(res, 'Work progress update logged successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/worker/complaints/:id/evidence
   */
  async uploadEvidence(req, res, next) {
    try {
      const result = await workerService.uploadEvidence(req.user, req.params.id, req.file, req.body);
      return successResponse(res, 'Evidence uploaded successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WorkerController();

