const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const { sanitizeUser, sanitizeUsers } = require('../utils/userSerializer');
const AppError = require('../utils/appError');
const {
  parsePagination,
  buildPaginationMeta,
  parseSorting,
  parseDateRange,
  parseMultiEnum,
} = require('../utils/queryHelper');

/**
 * User Service - Business Logic Layer
 */
class UserService {
  /**
   * Retrieve a user by ID
   * @param {string} id
   * @returns {Promise<object>} Sanitized user object
   */
  async getUserById(id, requestingUser = null) {
    if (
      requestingUser &&
      !['ADMIN', 'AUTHORITY'].includes(requestingUser.role) &&
      requestingUser.id !== id
    ) {
      throw new AppError('Forbidden: You can only view your own user profile.', 403);
    }

    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError(`User not found with ID: ${id}`, 404);
    }
    return sanitizeUser(user);
  }

  /**
   * Retrieve users with filtering, sorting, and pagination
   * @param {object} query - Query parameters (role, status, search, page, limit, sortBy, sortOrder)
   * @returns {Promise<object>} List of sanitized users and pagination metadata
   */
  async getUsers(query = {}) {
    const { page, limit, skip } = parsePagination(query, 20, 100);
    const { orderBy, sortBy, sortOrder } = parseSorting(
      query,
      ['createdAt', 'updatedAt', 'name', 'email', 'role', 'status', 'department'],
      'createdAt',
      'desc'
    );
    const dateRange = parseDateRange(query, 'createdAt');

    const where = { ...dateRange };

    // Filter by role if provided (supports comma-separated multi-enum)
    if (query.role && query.role !== 'ALL') {
      const roles = parseMultiEnum(query.role);
      if (roles && roles.length > 0) {
        where.role = roles.length === 1 ? roles[0] : { in: roles };
      }
    }

    // Filter by status if provided (supports comma-separated multi-enum)
    if (query.status && query.status !== 'ALL') {
      const statuses = parseMultiEnum(query.status);
      if (statuses && statuses.length > 0) {
        where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
      }
    }

    // Filter by department
    if (query.department && query.department !== 'ALL') {
      where.department = { contains: query.department.trim() };
    }

    // Filter by search query on name, email, or phone
    if (query.search && query.search.trim() !== '') {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { department: { contains: q } },
        { zone: { contains: q } },
      ];
    }

    const [users, total] = await Promise.all([
      userRepository.findMany({ where, skip, take: limit, orderBy }),
      userRepository.count(where),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);

    return {
      users: sanitizeUsers(users),
      pagination,
    };
  }

  /**
   * Create a new user with hashed password
   * @param {object} userData
   * @returns {Promise<object>} Sanitized created user
   */
  async createUser(userData) {
    const normalizedEmail = userData.email.toLowerCase().trim();

    // Verify email uniqueness
    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new AppError(`A user with email '${normalizedEmail}' already exists.`, 409);
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const newUser = await userRepository.create({
      ...userData,
      email: normalizedEmail,
      password: hashedPassword,
    });

    return sanitizeUser(newUser);
  }
}

module.exports = new UserService();

