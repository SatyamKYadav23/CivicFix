const prisma = require('../config/db');

/**
 * Analytics Repository - Efficient MySQL Aggregations
 * Uses Prisma count, groupBy, and parameterized raw SQL for high-performance aggregations.
 */
class AnalyticsRepository {
  // =========================================================================
  // CITIZEN ANALYTICS
  // =========================================================================

  /**
   * Get grievance statistics for a specific citizen
   * @param {string} citizenId
   */
  async getCitizenStats(citizenId) {
    const [
      total,
      pending,
      inProgress,
      resolved,
      closed,
      statusGroups,
      recentComplaints,
    ] = await Promise.all([
      prisma.complaint.count({
        where: { citizenId },
      }),
      prisma.complaint.count({
        where: {
          citizenId,
          status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
        },
      }),
      prisma.complaint.count({
        where: {
          citizenId,
          status: { in: ['ASSIGNED', 'IN_PROGRESS', 'RESOLUTION_SUBMITTED'] },
        },
      }),
      prisma.complaint.count({
        where: {
          citizenId,
          status: 'RESOLVED',
        },
      }),
      prisma.complaint.count({
        where: {
          citizenId,
          status: 'CLOSED',
        },
      }),
      prisma.complaint.groupBy({
        by: ['status'],
        where: { citizenId },
        _count: { id: true },
      }),
      prisma.complaint.findMany({
        where: { citizenId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          category: true,
          priority: true,
          status: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          resolvedAt: true,
        },
      }),
    ]);

    const statusCounts = {};
    statusGroups.forEach((g) => {
      statusCounts[g.status] = g._count.id;
    });

    return {
      total,
      pending,
      inProgress,
      resolved,
      closed,
      totalResolved: resolved + closed,
      statusCounts,
      recentComplaints,
    };
  }

  // =========================================================================
  // AUTHORITY ANALYTICS
  // =========================================================================

  /**
   * Get operational metrics for an authority's department jurisdiction
   * @param {Object} options - { department, categories, zone }
   */
  async getAuthorityStats({ department, categories, zone } = {}) {
    const where = {};

    if (categories && categories.length > 0) {
      where.category = { in: categories };
    }

    const [
      total,
      pending,
      assigned,
      inProgress,
      resolved,
      closed,
      rejected,
      highPriority,
      unassigned,
      statusGroups,
      categoryGroups,
      priorityGroups,
    ] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.count({
        where: { ...where, status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      }),
      prisma.complaint.count({
        where: { ...where, status: 'ASSIGNED' },
      }),
      prisma.complaint.count({
        where: { ...where, status: { in: ['IN_PROGRESS', 'RESOLUTION_SUBMITTED'] } },
      }),
      prisma.complaint.count({
        where: { ...where, status: 'RESOLVED' },
      }),
      prisma.complaint.count({
        where: { ...where, status: 'CLOSED' },
      }),
      prisma.complaint.count({
        where: { ...where, status: 'REJECTED' },
      }),
      prisma.complaint.count({
        where: {
          ...where,
          priority: { in: ['HIGH', 'CRITICAL'] },
          status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED', 'CANCELLED'] },
        },
      }),
      prisma.complaint.count({
        where: {
          ...where,
          assignedWorkerId: null,
          status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED', 'CANCELLED'] },
        },
      }),
      prisma.complaint.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.complaint.groupBy({
        by: ['category'],
        where,
        _count: { id: true },
      }),
      prisma.complaint.groupBy({
        by: ['priority'],
        where,
        _count: { id: true },
      }),
    ]);

    // Calculate average resolution time using MySQL TIMESTAMPDIFF
    let avgResolutionQuery = `
      SELECT AVG(TIMESTAMPDIFF(SECOND, createdAt, resolvedAt)) as avgSeconds
      FROM complaints
      WHERE resolvedAt IS NOT NULL AND status IN ('RESOLVED', 'CLOSED')
    `;
    const params = [];
    if (categories && categories.length > 0) {
      const placeholders = categories.map(() => '?').join(',');
      avgResolutionQuery += ` AND category IN (${placeholders})`;
      params.push(...categories);
    }

    const avgResult = await prisma.$queryRawUnsafe(avgResolutionQuery, ...params);
    const avgSeconds = avgResult[0]?.avgSeconds ? Number(avgResult[0].avgSeconds) : 0;

    // Calculate citizen satisfaction average within jurisdiction
    let satisfactionQuery = `
      SELECT 
        COUNT(id) as reviewCount,
        AVG(CAST(JSON_EXTRACT(feedback, '$.rating') AS DECIMAL(3,1))) as avgRating
      FROM complaints
      WHERE feedback IS NOT NULL
    `;
    const satParams = [];
    if (categories && categories.length > 0) {
      const placeholders = categories.map(() => '?').join(',');
      satisfactionQuery += ` AND category IN (${placeholders})`;
      satParams.push(...categories);
    }

    const satResult = await prisma.$queryRawUnsafe(satisfactionQuery, ...satParams);
    const reviewCount = satResult[0]?.reviewCount ? Number(satResult[0].reviewCount) : 0;
    const avgRating = satResult[0]?.avgRating ? Number(satResult[0].avgRating) : 0;

    // Status map
    const statusCounts = {};
    statusGroups.forEach((g) => {
      statusCounts[g.status] = g._count.id;
    });

    // Category map
    const categoryCounts = {};
    categoryGroups.forEach((g) => {
      categoryCounts[g.category] = g._count.id;
    });

    // Priority map
    const priorityCounts = {};
    priorityGroups.forEach((g) => {
      priorityCounts[g.priority] = g._count.id;
    });

    // Top performing workers in department
    const topWorkers = await prisma.user.findMany({
      where: {
        role: 'WORKER',
        ...(department && department !== 'ALL' ? { department: { contains: department } } : {}),
        status: { not: 'INACTIVE' },
      },
      take: 5,
      select: {
        id: true,
        name: true,
        department: true,
        status: true,
        workerProfile: {
          select: {
            skills: true,
            isAvailable: true,
          },
        },
        _count: {
          select: {
            assignedTasks: true,
          },
        },
      },
    });

    return {
      department: department || 'All Departments',
      total,
      pending,
      assigned,
      inProgress,
      resolved: resolved + closed,
      resolvedCount: resolved,
      closedCount: closed,
      rejectedCount: rejected,
      highPriority,
      unassigned,
      avgResolutionSeconds: avgSeconds,
      avgResolutionHours: Number((avgSeconds / 3600).toFixed(1)),
      satisfaction: {
        average: Number(avgRating.toFixed(1)),
        reviewCount,
      },
      statusCounts,
      categoryCounts,
      priorityCounts,
      topWorkers,
    };
  }

  // =========================================================================
  // WORKER ANALYTICS
  // =========================================================================

  /**
   * Get workload and task metrics for a specific field technician
   * @param {string} workerId
   */
  async getWorkerStats(workerId) {
    const [
      assignedComplaints,
      activeComplaints,
      completedComplaints,
      pendingAcceptance,
      inProgress,
      workerUser,
      recentTasks,
    ] = await Promise.all([
      prisma.complaint.count({
        where: { assignedWorkerId: workerId },
      }),
      prisma.complaint.count({
        where: {
          assignedWorkerId: workerId,
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
        },
      }),
      prisma.complaint.count({
        where: {
          assignedWorkerId: workerId,
          status: { in: ['RESOLUTION_SUBMITTED', 'RESOLVED', 'CLOSED'] },
        },
      }),
      prisma.complaint.count({
        where: {
          assignedWorkerId: workerId,
          status: 'ASSIGNED',
          NOT: { taskStatus: 'ACCEPTED' },
        },
      }),
      prisma.complaint.count({
        where: {
          assignedWorkerId: workerId,
          status: 'IN_PROGRESS',
        },
      }),
      prisma.user.findUnique({
        where: { id: workerId },
        include: {
          workerProfile: true,
        },
      }),
      prisma.complaint.findMany({
        where: { assignedWorkerId: workerId },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          category: true,
          priority: true,
          status: true,
          taskStatus: true,
          location: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    // Average resolution time for this worker
    const avgWorkerResult = await prisma.$queryRawUnsafe(
      `SELECT AVG(TIMESTAMPDIFF(SECOND, createdAt, resolvedAt)) as avgSeconds
       FROM complaints
       WHERE assignedWorkerId = ? AND resolvedAt IS NOT NULL AND status IN ('RESOLVED', 'CLOSED')`,
      workerId
    );
    const avgSeconds = avgWorkerResult[0]?.avgSeconds ? Number(avgWorkerResult[0].avgSeconds) : 0;

    // Capacity load: active * 25% capped at 100%
    const capacityLoadPercentage = Math.min(100, activeComplaints * 25);

    return {
      workerId,
      name: workerUser?.name || 'Technician',
      department: workerUser?.department || 'Field Operations',
      dutyStatus: workerUser?.status || (workerUser?.workerProfile?.isAvailable ? 'AVAILABLE' : 'OFFLINE'),
      isAvailable: workerUser?.workerProfile ? workerUser.workerProfile.isAvailable : workerUser?.status === 'AVAILABLE',
      assignedComplaints,
      activeComplaints,
      completedComplaints,
      workload: {
        total: assignedComplaints,
        active: activeComplaints,
        completed: completedComplaints,
        pendingAcceptance,
        inProgress,
        capacityLoadPercentage,
      },
      avgResolutionHours: Number((avgSeconds / 3600).toFixed(1)),
      recentTasks,
    };
  }

  // =========================================================================
  // ADMIN ANALYTICS
  // =========================================================================

  /**
   * Get comprehensive system-wide platform statistics & time-series trends
   * @param {Object} options - { months = 12 }
   */
  async getAdminStats({ months = 12 } = {}) {
    const numMonths = Math.min(36, Math.max(1, parseInt(months, 10) || 12));

    const [
      totalUsers,
      usersByRole,
      totalComplaints,
      pendingComplaints,
      activeComplaints,
      resolvedComplaints,
      closedComplaints,
      rejectedComplaints,
      statusGroups,
      categoryGroups,
      priorityGroups,
      totalAssignments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
      prisma.complaint.count(),
      prisma.complaint.count({
        where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      }),
      prisma.complaint.count({
        where: { status: { in: ['ASSIGNED', 'IN_PROGRESS', 'RESOLUTION_SUBMITTED'] } },
      }),
      prisma.complaint.count({
        where: { status: 'RESOLVED' },
      }),
      prisma.complaint.count({
        where: { status: 'CLOSED' },
      }),
      prisma.complaint.count({
        where: { status: 'REJECTED' },
      }),
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
    ]);

    // Map user roles
    const userRoleCounts = {
      CITIZEN: 0,
      WORKER: 0,
      AUTHORITY: 0,
      ADMIN: 0,
    };
    usersByRole.forEach((r) => {
      userRoleCounts[r.role] = r._count.id;
    });

    // Map complaint statuses
    const complaintStatusCounts = {};
    statusGroups.forEach((s) => {
      complaintStatusCounts[s.status] = s._count.id;
    });

    // Map categories
    const categoryCounts = {};
    categoryGroups.forEach((c) => {
      categoryCounts[c.category] = c._count.id;
    });

    // Map priorities
    const priorityCounts = {};
    priorityGroups.forEach((p) => {
      priorityCounts[p.priority] = p._count.id;
    });

    // System-wide Average Resolution Time in MySQL
    const avgResult = await prisma.$queryRawUnsafe(`
      SELECT AVG(TIMESTAMPDIFF(SECOND, createdAt, resolvedAt)) as avgSeconds
      FROM complaints
      WHERE resolvedAt IS NOT NULL AND status IN ('RESOLVED', 'CLOSED')
    `);
    const avgSeconds = avgResult[0]?.avgSeconds ? Number(avgResult[0].avgSeconds) : 0;

    // Citizen Satisfaction Average
    const satResult = await prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(id) as reviewCount,
        AVG(CAST(JSON_EXTRACT(feedback, '$.rating') AS DECIMAL(3,1))) as avgRating
      FROM complaints
      WHERE feedback IS NOT NULL
    `);
    const reviewCount = satResult[0]?.reviewCount ? Number(satResult[0].reviewCount) : 0;
    const avgRating = satResult[0]?.avgRating ? Number(satResult[0].avgRating) : 0;

    // Complaints Over Time (Monthly Time-Series Aggregation)
    const timeSeriesResult = await prisma.$queryRawUnsafe(
      `
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') AS period,
        COUNT(id) AS total,
        SUM(CASE WHEN status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) AS resolved,
        SUM(CASE WHEN status IN ('SUBMITTED', 'UNDER_REVIEW') THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status IN ('ASSIGNED', 'IN_PROGRESS', 'RESOLUTION_SUBMITTED') THEN 1 ELSE 0 END) AS inProgress
      FROM complaints
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY period ASC
      `,
      numMonths
    );

    const timeSeries = timeSeriesResult.map((row) => ({
      period: row.period,
      total: Number(row.total || 0),
      resolved: Number(row.resolved || 0),
      pending: Number(row.pending || 0),
      inProgress: Number(row.inProgress || 0),
    }));

    const totalResolved = resolvedComplaints + closedComplaints;
    const resolutionRate = totalComplaints > 0
      ? Number(((totalResolved / totalComplaints) * 100).toFixed(1))
      : 100.0;

    return {
      users: {
        total: totalUsers,
        citizens: userRoleCounts.CITIZEN,
        workers: userRoleCounts.WORKER,
        authorities: userRoleCounts.AUTHORITY,
        admins: userRoleCounts.ADMIN,
        byRole: userRoleCounts,
      },
      complaints: {
        total: totalComplaints,
        resolved: totalResolved,
        resolvedOnly: resolvedComplaints,
        closedOnly: closedComplaints,
        pending: pendingComplaints,
        active: activeComplaints,
        rejected: rejectedComplaints,
        resolutionRate,
        avgResolutionSeconds: avgSeconds,
        avgResolutionHours: Number((avgSeconds / 3600).toFixed(1)),
        byCategory: categoryCounts,
        byStatus: complaintStatusCounts,
        byPriority: priorityCounts,
      },
      satisfaction: {
        averageScore: Number(avgRating.toFixed(1)),
        reviewCount,
      },
      assignments: {
        total: totalAssignments,
      },
      timeSeries,
    };
  }
}

module.exports = new AnalyticsRepository();

