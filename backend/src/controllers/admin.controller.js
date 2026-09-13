const adminService = require('../services/admin.service');
const { successResponse } = require('../utils/apiResponse');

/**
 * Admin Controller - Handles administrative API endpoints
 */
class AdminController {
  // =========================================================================
  // SYSTEM ANALYTICS & DASHBOARD
  // =========================================================================

  async getStats(req, res, next) {
    try {
      const stats = await adminService.getSystemStats();
      return successResponse(res, 'System statistics retrieved successfully', stats, 200);
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const logs = await adminService.getAuditLogs(req.query);
      return successResponse(res, 'System audit logs retrieved successfully', logs, 200);
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // USER MANAGEMENT
  // =========================================================================

  async listUsers(req, res, next) {
    try {
      const result = await adminService.listUsers(req.query);
      return successResponse(res, 'Users retrieved successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await adminService.getUserById(req.params.id);
      return successResponse(res, 'User details retrieved successfully', user, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const updated = await adminService.updateUserStatus(req.user, req.params.id, req.body);
      return successResponse(res, 'User status updated successfully', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      const updated = await adminService.updateUserRole(req.user, req.params.id, req.body);
      return successResponse(res, 'User role updated successfully', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const created = await adminService.createUser(req.user, req.body);
      return successResponse(res, 'User created successfully', created, 201);
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // COMPLAINT MANAGEMENT
  // =========================================================================

  async listComplaints(req, res, next) {
    try {
      const result = await adminService.listComplaints(req.query);
      return successResponse(res, 'Complaints retrieved successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  async getComplaintDetails(req, res, next) {
    try {
      const complaint = await adminService.getComplaintDetails(req.params.id);
      return successResponse(res, 'Complaint details retrieved successfully', complaint, 200);
    } catch (error) {
      next(error);
    }
  }

  async getComplaintHistory(req, res, next) {
    try {
      const history = await adminService.getComplaintHistory(req.params.id);
      return successResponse(res, 'Complaint history retrieved successfully', history, 200);
    } catch (error) {
      next(error);
    }
  }

  async overrideComplaintStatus(req, res, next) {
    try {
      const updated = await adminService.overrideComplaintStatus(req.user, req.params.id, req.body);
      return successResponse(res, 'Complaint status updated by administrator', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  async overrideComplaintPriority(req, res, next) {
    try {
      const updated = await adminService.overrideComplaintPriority(req.user, req.params.id, req.body);
      return successResponse(res, 'Complaint priority updated by administrator', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  async deleteComplaint(req, res, next) {
    try {
      const result = await adminService.deleteComplaint(req.user, req.params.id, req.body);
      return successResponse(res, result.message, null, 200);
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // WORKER MANAGEMENT
  // =========================================================================

  async listWorkers(req, res, next) {
    try {
      const result = await adminService.listWorkers(req.query);
      return successResponse(res, 'Field worker roster retrieved successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateWorkerStatus(req, res, next) {
    try {
      const updated = await adminService.updateWorkerStatus(req.user, req.params.id, req.body);
      return successResponse(res, 'Worker status updated successfully', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateWorkerProfile(req, res, next) {
    try {
      const updated = await adminService.updateWorkerProfile(req.user, req.params.id, req.body);
      return successResponse(res, 'Worker profile updated successfully', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // AUTHORITY MANAGEMENT
  // =========================================================================

  async listAuthorities(req, res, next) {
    try {
      const result = await adminService.listAuthorities(req.query);
      return successResponse(res, 'Authorities retrieved successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateAuthorityJurisdiction(req, res, next) {
    try {
      const updated = await adminService.updateAuthorityJurisdiction(req.user, req.params.id, req.body);
      return successResponse(res, 'Authority jurisdiction updated successfully', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  async getDepartments(req, res, next) {
    try {
      const depts = await adminService.getDepartmentsOverview();
      return successResponse(res, 'Departments retrieved successfully', depts, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
