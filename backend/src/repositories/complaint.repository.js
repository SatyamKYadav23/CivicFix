const prisma = require('../config/db');

const defaultInclude = {
  citizen: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  },
  assignedWorker: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      department: true,
      role: true,
    },
  },
  assignedAuthority: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      department: true,
      zone: true,
      designation: true,
      role: true,
    },
  },
  history: {
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          avatar: true,
        },
      },
    },
  },
  assignments: {
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      worker: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          department: true,
          role: true,
        },
      },
      assignedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          designation: true,
          role: true,
        },
      },
    },
  },
  workUpdates: {
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      worker: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
        },
      },
    },
  },
};



/**
 * Complaint Repository - Data Access Layer
 */
class ComplaintRepository {
  /**
   * Create a new complaint
   */
  async create(data) {
    return prisma.complaint.create({
      data,
      include: defaultInclude,
    });
  }

  /**
   * Find a single complaint by ID with relationships
   */
  async findById(id) {
    return prisma.complaint.findUnique({
      where: { id },
      include: defaultInclude,
    });
  }

  /**
   * Find multiple complaints with filters, pagination, and sorting
   */
  async findMany({ where = {}, skip = 0, take = 10, orderBy = { createdAt: 'desc' } } = {}) {
    return prisma.complaint.findMany({
      where,
      skip,
      take,
      orderBy,
      include: defaultInclude,
    });
  }

  /**
   * Count total complaints matching criteria
   */
  async count(where = {}) {
    return prisma.complaint.count({ where });
  }

  /**
   * Update complaint by ID
   */
  async update(id, data) {
    return prisma.complaint.update({
      where: { id },
      data,
      include: defaultInclude,
    });
  }

  /**
   * Delete complaint by ID
   */
  async delete(id) {
    return prisma.complaint.delete({
      where: { id },
    });
  }
}

module.exports = new ComplaintRepository();

