const prisma = require('../config/db');

/**
 * Notification Repository - Data Access Layer for User Notifications
 */
class NotificationRepository {
  /**
   * Create a new notification
   */
  async create(data) {
    return prisma.notification.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        complaint: {
          select: {
            id: true,
            title: true,
            status: true,
            category: true,
            priority: true,
            location: true,
          },
        },
      },
    });
  }

  /**
   * Batch create notifications
   */
  async createMany(dataArray) {
    if (!dataArray || dataArray.length === 0) return { count: 0 };
    return prisma.notification.createMany({
      data: dataArray,
    });
  }

  /**
   * Find a notification by primary key ID
   */
  async findById(id) {
    return prisma.notification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        complaint: {
          select: {
            id: true,
            title: true,
            status: true,
            category: true,
            priority: true,
            location: true,
          },
        },
      },
    });
  }

  /**
   * Count notifications matching criteria
   */
  async count(where = {}) {
    return prisma.notification.count({ where });
  }

  /**
   * Find notifications for a specific user
   */
  async findByUser(userId, { read, type, where: customWhere = {}, skip = 0, take = 50, orderBy = { createdAt: 'desc' } } = {}) {
    const where = { userId, ...customWhere };
    if (typeof read === 'boolean') {
      where.read = read;
    }
    if (type) {
      where.type = type;
    }

    return prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        complaint: {
          select: {
            id: true,
            title: true,
            status: true,
            category: true,
            priority: true,
            location: true,
          },
        },
      },
    });
  }

  /**
   * Count unread notifications for a user
   */
  async countUnread(userId) {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(userId, notificationId) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
      },
    });
  }

  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }
}

module.exports = new NotificationRepository();

