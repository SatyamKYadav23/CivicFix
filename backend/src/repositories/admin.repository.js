const prisma = require('../config/db');

/**
 * Admin Repository - Data Access Layer for System Administration
 */
class AdminRepository {
  /**
   * Create an administrative audit log entry
   */
  async createAuditLog({ actorId, action, targetType, targetId, details, ipAddress }) {
    return prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        details: details || {},
        ipAddress: ipAddress || null,
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Query system audit logs with filtering and pagination
   */
  async findAuditLogs({ search, action, targetType, actorId, dateRange = {}, orderBy = { createdAt: 'desc' }, skip = 0, take = 50 } = {}) {
    const where = { ...dateRange };

    if (action) {
      where.action = action;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (actorId) {
      where.actorId = actorId;
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { action: { contains: q } },
        { targetType: { contains: q } },
        { targetId: { contains: q } },
        { actor: { name: { contains: q } } },
        { actor: { email: { contains: q } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Aggregate system-wide analytics & statistics
   */
  async getSystemStats() {
    const [
      totalUsers,
      usersByRole,
      usersByStatus,
      totalComplaints,
      complaintsByStatus,
      complaintsByCategory,
      complaintsByPriority,
      totalAssignments,
      activeAssignments,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
      prisma.user.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.complaint.count(),
      prisma.complaint.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.complaint.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
      prisma.complaint.groupBy({
        by: ['priority'],
        _count: { id: true },
      }),
      prisma.assignment.count(),
      prisma.assignment.count({
        where: {
          status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] },
        },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    // Map role counts
    const roleCounts = {
      CITIZEN: 0,
      WORKER: 0,
      AUTHORITY: 0,
      ADMIN: 0,
    };
    usersByRole.forEach((r) => {
      roleCounts[r.role] = r._count.id;
    });

    // Map status counts for users
    const userStatusCounts = {};
    usersByStatus.forEach((s) => {
      userStatusCounts[s.status] = s._count.id;
    });

    // Map status counts for complaints
    const complaintStatusCounts = {
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      RESOLUTION_SUBMITTED: 0,
      RESOLVED: 0,
      CLOSED: 0,
      REOPENED: 0,
      REJECTED: 0,
      CANCELLED: 0,
    };
    complaintsByStatus.forEach((s) => {
      complaintStatusCounts[s.status] = s._count.id;
    });

    // Map category breakdown
    const categoryCounts = {};
    complaintsByCategory.forEach((c) => {
      categoryCounts[c.category] = c._count.id;
    });

    // Map priority breakdown
    const priorityCounts = {};
    complaintsByPriority.forEach((p) => {
      priorityCounts[p.priority] = p._count.id;
    });

    // Calculate resolution rate
    const resolvedOrClosed = complaintStatusCounts.RESOLVED + complaintStatusCounts.CLOSED;
    const resolutionRate = totalComplaints > 0
      ? Number(((resolvedOrClosed / totalComplaints) * 100).toFixed(1))
      : 100;

    return {
      users: {
        total: totalUsers,
        byRole: roleCounts,
        byStatus: userStatusCounts,
      },
      complaints: {
        total: totalComplaints,
        byStatus: complaintStatusCounts,
        byCategory: categoryCounts,
        byPriority: priorityCounts,
        resolutionRate,
      },
      workforce: {
        totalAssignments,
        activeAssignments,
      },
      assignments: {
        total: totalAssignments,
        active: activeAssignments,
      },
      recentActivity: recentAuditLogs,
    };
  }

  /**
   * Retrieve technicians with computed workload metrics
   */
  async getWorkersWorkload({ department, search, status, dateRange = {}, orderBy = { name: 'asc' }, skip = 0, take = 50 } = {}) {
    const where = {
      role: 'WORKER',
      ...dateRange,
    };

    if (department && department !== 'ALL') {
      where.department = { contains: department };
    }

    if (status && status !== 'ALL') {
      if (typeof status === 'object') {
        where.status = status;
      } else {
        where.status = status;
      }
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { department: { contains: q } },
        { zone: { contains: q } },
      ];
    }

    const [workers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          workerProfile: true,
          workerAssignments: {
            select: {
              id: true,
              status: true,
              complaintId: true,
              assignedAt: true,
              acceptedAt: true,
              startedAt: true,
              completedAt: true,
            },
          },
          _count: {
            select: {
              assignedTasks: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const formattedWorkers = workers.map((w) => {
      const activeTasks = w.workerAssignments.filter((a) =>
        ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(a.status)
      ).length;

      const completedTasks = w.workerAssignments.filter((a) =>
        a.status === 'COMPLETED'
      ).length;

      return {
        id: w.id,
        name: w.name,
        email: w.email,
        phone: w.phone,
        status: w.status,
        department: w.department,
        zone: w.zone,
        designation: w.designation,
        skills: w.workerProfile?.skills || w.skills || '',
        vehicleNumber: w.workerProfile?.vehicleNumber || null,
        isAvailable: w.workerProfile ? w.workerProfile.isAvailable : w.status === 'AVAILABLE',
        activeTasks: activeTasks,
        activeTasksCount: activeTasks,
        completedTasks: completedTasks,
        completedTasksCount: completedTasks,
        totalAssigned: w._count.assignedTasks,
        totalAssignedCount: w._count.assignedTasks,
        createdAt: w.createdAt,
      };
    });

    return { workers: formattedWorkers, total };
  }

  /**
   * Retrieve authorities with caseload metrics
   */
  async getAuthoritiesOverview({ department, search, status, dateRange = {}, orderBy = { name: 'asc' }, skip = 0, take = 50 } = {}) {
    const where = {
      role: 'AUTHORITY',
      ...dateRange,
    };

    if (department && department !== 'ALL') {
      where.department = { contains: department };
    }

    if (status && status !== 'ALL') {
      if (typeof status === 'object') {
        where.status = status;
      } else {
        where.status = status;
      }
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { department: { contains: q } },
        { zone: { contains: q } },
      ];
    }

    const [authorities, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          _count: {
            select: {
              managedComplaints: true,
              managedAssignments: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const formatted = authorities.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      status: a.status,
      department: a.department,
      zone: a.zone,
      designation: a.designation,
      activeCaseload: a._count.managedComplaints,
      managedComplaintsCount: a._count.managedComplaints,
      managedAssignmentsCount: a._count.managedAssignments,
      createdAt: a.createdAt,
    }));

    return { authorities: formatted, total };
  }
}

module.exports = new AdminRepository();
