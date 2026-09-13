const prisma = require('../config/db');

/**
 * User Repository - Data Access Layer for User entity
 */
class UserRepository {
  /**
   * Find a user by primary key ID
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find a user by unique email
   */
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  /**
   * Find multiple users with filters, pagination, and sorting
   */
  async findMany({ where = {}, skip = 0, take = 20, orderBy = { createdAt: 'desc' } } = {}) {
    return prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
    });
  }

  /**
   * Count users matching filter criteria
   */
  async count(where = {}) {
    return prisma.user.count({ where });
  }

  /**
   * Create a new user record
   */
  async create(data) {
    return prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase().trim(),
      },
    });
  }

  /**
   * Update an existing user
   */
  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a user by ID
   */
  async delete(id) {
    return prisma.user.delete({
      where: { id },
    });
  }
}

module.exports = new UserRepository();

