const prisma = require('../config/db');

const defaultAssignmentInclude = {
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
  complaint: {
    select: {
      id: true,
      title: true,
      category: true,
      priority: true,
      status: true,
      location: true,
      latitude: true,
      longitude: true,
    },
  },
};

/**
 * Assignment Repository - Data Access Layer for Worker Assignments
 */
class AssignmentRepository {
  /**
   * Create a new complaint assignment
   */
  async create(data) {
    return prisma.assignment.create({
      data,
      include: defaultAssignmentInclude,
    });
  }

  /**
   * Find an assignment by ID
   */
  async findById(id) {
    return prisma.assignment.findUnique({
      where: { id },
      include: defaultAssignmentInclude,
    });
  }

  /**
   * Find active assignment for a complaint
   */
  async findActiveByComplaint(complaintId) {
    return prisma.assignment.findFirst({
      where: {
        complaintId,
        status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] },
      },
      orderBy: { createdAt: 'desc' },
      include: defaultAssignmentInclude,
    });
  }

  /**
   * Find all assignments for a worker
   */
  async findByWorker(workerId, { status, skip = 0, take = 50 } = {}) {
    const where = { workerId };
    if (status && status !== 'ALL') {
      where.status = status;
    }

    return prisma.assignment.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: defaultAssignmentInclude,
    });
  }

  /**
   * Update an assignment record
   */
  async update(id, data) {
    return prisma.assignment.update({
      where: { id },
      data,
      include: defaultAssignmentInclude,
    });
  }
}

module.exports = new AssignmentRepository();

