const prisma = require('../config/db');

const defaultWorkUpdateInclude = {
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
};

/**
 * WorkUpdate Repository - Data Access Layer for Worker Progress & Evidence Notes
 */
class WorkUpdateRepository {
  /**
   * Create a new work update
   */
  async create(data) {
    return prisma.workUpdate.create({
      data,
      include: defaultWorkUpdateInclude,
    });
  }

  /**
   * Retrieve all work updates for a given complaint
   */
  async findByComplaint(complaintId) {
    return prisma.workUpdate.findMany({
      where: { complaintId },
      orderBy: { createdAt: 'asc' },
      include: defaultWorkUpdateInclude,
    });
  }

  /**
   * Retrieve work updates submitted by a worker
   */
  async findByWorker(workerId, { skip = 0, take = 50 } = {}) {
    return prisma.workUpdate.findMany({
      where: { workerId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: defaultWorkUpdateInclude,
    });
  }
}

module.exports = new WorkUpdateRepository();

