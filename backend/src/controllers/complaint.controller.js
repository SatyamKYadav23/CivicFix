const complaintService = require('../services/complaint.service');
const { successResponse } = require('../utils/apiResponse');

/**
 * Complaint Controller - Handles HTTP requests for complaints
 */
class ComplaintController {
  /**
   * POST /api/complaints
   * Report a new civic issue
   */
  async createComplaint(req, res, next) {
    try {
      const complaint = await complaintService.createComplaint(req.user, req.body, req.file);
      return successResponse(res, 'Complaint reported successfully', complaint, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/complaints
   * List complaints with filtering, sorting, and pagination
   */
  async getComplaints(req, res, next) {
    try {
      const result = await complaintService.getComplaints(req.user, req.query);
      return successResponse(res, 'Complaints retrieved successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/complaints/:id
   * Get single complaint by ID
   */
  async getComplaintById(req, res, next) {
    try {
      const complaint = await complaintService.getComplaintById(req.user, req.params.id);
      return successResponse(res, 'Complaint details retrieved successfully', complaint, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/complaints/:id
   * Update complaint information
   */
  async updateComplaint(req, res, next) {
    try {
      const updated = await complaintService.updateComplaint(req.user, req.params.id, req.body, req.file);
      return successResponse(res, 'Complaint updated successfully', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/complaints/:id
   * Delete or cancel a complaint
   */
  async deleteComplaint(req, res, next) {
    try {
      const result = await complaintService.deleteComplaint(req.user, req.params.id);
      return successResponse(res, result.message, null, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/complaints/:id/feedback
   * Submit citizen satisfaction rating and comment
   */
  async submitFeedback(req, res, next) {
    try {
      const result = await complaintService.submitFeedback(req.user, req.params.id, req.body);
      return successResponse(res, 'Feedback submitted and complaint closed successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/complaints/:id/history (or timeline)
   * Retrieve complaint audit timeline
   */
  async getComplaintTimeline(req, res, next) {
    try {
      const timeline = await complaintService.getComplaintTimeline(req.user, req.params.id);
      return successResponse(res, 'Complaint timeline retrieved successfully', timeline, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ComplaintController();


