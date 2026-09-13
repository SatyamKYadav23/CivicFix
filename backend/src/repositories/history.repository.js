const prisma = require('../config/db');

const defaultActorInclude = {
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
};

/**
 * Complaint History Repository - Data Access Layer
 */
class HistoryRepository {
  /**
   * Create a new history audit log entry
   * @param {Object} data - { complaintId, fromStatus, toStatus, action, notes, actorId }
   */
  async create(data) {
    return prisma.complaintHistory.create({
      data,
      include: defaultActorInclude,
    });
  }

  /**
   * Find all history entries for a given complaint, ordered chronologically
   * @param {string} complaintId
   */
  async findByComplaintId(complaintId) {
    return prisma.complaintHistory.findMany({
      where: { complaintId },
      orderBy: { createdAt: 'asc' },
      include: defaultActorInclude,
    });
  }

  async findByComplaint(complaintId) {
    return this.findByComplaintId(complaintId);
  }
}

module.exports = new HistoryRepository();

