const authService = require('../services/auth.service');
const { successResponse } = require('../utils/apiResponse');

/**
 * Authentication Controller - Handles auth requests
 */
class AuthController {
  /**
   * POST /api/auth/register
   * Registers a new Citizen account
   */
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return successResponse(res, 'Registration successful', result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Authenticates user and returns JWT + safe user
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return successResponse(res, 'Login successful', result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Retrieves profile for the currently authenticated user
   */
  async getMe(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      return successResponse(res, 'Current user retrieved successfully', user, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Confirms logout to client
   */
  async logout(req, res, next) {
    try {
      const result = authService.logout();
      return successResponse(res, result.message, null, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

