const userService = require('../services/user.service');
const { successResponse } = require('../utils/apiResponse');

/**
 * User Controller - Handles HTTP requests for user endpoints
 */
class UserController {
  /**
   * GET /api/users
   * Retrieves users with optional filtering and pagination
   */
  async getUsers(req, res, next) {
    try {
      const data = await userService.getUsers(req.query);
      return successResponse(res, 'Users retrieved successfully', data, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id
   * Retrieves a single user by primary key ID
   */
  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id, req.user);
      return successResponse(res, 'User retrieved successfully', user, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users
   * Creates a new user (with password hashing and sanitization)
   */
  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      return successResponse(res, 'User created successfully', user, 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();

