const analyticsRepository = require('../repositories/analytics.repository');
const { getCategoriesForDepartment } = require('./jurisdiction.helper');
const AppError = require('../utils/appError');

/**
 * Analytics Service - High-Performance Metrics & Chart Data Formatting
 */
class AnalyticsService {
  /**
   * Universal smart dashboard resolver based on authenticated user role
   */
  async getDashboard(user, query = {}) {
    if (!user) {
      throw new AppError('Authentication required to access analytics dashboard.', 401);
    }

    switch (user.role) {
      case 'CITIZEN':
        return this.getCitizenDashboard(user);
      case 'AUTHORITY':
        return this.getAuthorityDashboard(user, query);
      case 'WORKER':
        return this.getWorkerDashboard(user);
      case 'ADMIN':
        return this.getAdminDashboard(query);
      default:
        throw new AppError(`Unknown role: ${user.role}`, 400);
    }
  }

  // =========================================================================
  // CITIZEN DASHBOARD
  // =========================================================================

  /**
   * Citizen dashboard statistics
   */
  async getCitizenDashboard(user) {
    const stats = await analyticsRepository.getCitizenStats(user.id);

    return {
      role: 'CITIZEN',
      citizen: {
        id: user.id,
        name: user.name,
      },
      summary: {
        totalComplaints: stats.total,
        pendingComplaints: stats.pending,
        inProgressComplaints: stats.inProgress,
        resolvedComplaints: stats.totalResolved,
        awaitingFeedback: stats.resolved,
        closedComplaints: stats.closed,
      },
      kpis: [
        {
          id: 'total',
          label: 'Total Complaints',
          value: stats.total,
          subtitle: 'All reported civic issues',
          icon: '📋',
          variant: 'primary',
        },
        {
          id: 'pending',
          label: 'Pending Review',
          value: stats.pending,
          subtitle: 'Awaiting triage by authority',
          icon: '⏳',
          variant: 'warning',
        },
        {
          id: 'in_progress',
          label: 'In Progress',
          value: stats.inProgress,
          subtitle: 'Field repair underway',
          icon: '⚡',
          variant: 'primary',
        },
        {
          id: 'resolved',
          label: 'Resolved & Closed',
          value: stats.totalResolved,
          subtitle: 'Successfully completed',
          icon: '✅',
          variant: 'success',
        },
      ],
      statusCounts: stats.statusCounts,
      recentComplaints: stats.recentComplaints,
    };
  }

  // =========================================================================
  // AUTHORITY DASHBOARD
  // =========================================================================

  /**
   * Authority dashboard statistics (scoped to department/jurisdiction)
   */
  async getAuthorityDashboard(user, query = {}) {
    // If admin is viewing, allow department query param; otherwise default to officer department
    const department = query.department || user.department || null;
    const categories = getCategoriesForDepartment(department);

    const stats = await analyticsRepository.getAuthorityStats({
      department,
      categories,
      zone: user.zone || query.zone || null,
    });

    const resolutionRate = stats.total > 0
      ? Number(((stats.resolved / stats.total) * 100).toFixed(1))
      : 100.0;

    return {
      role: 'AUTHORITY',
      department: stats.department,
      officer: {
        id: user.id,
        name: user.name,
        zone: user.zone || 'Central',
      },
      summary: {
        totalComplaints: stats.total,
        pending: stats.pending,
        assigned: stats.assigned,
        inProgress: stats.inProgress,
        resolved: stats.resolved,
        highPriority: stats.highPriority,
        unassigned: stats.unassigned,
        averageResolutionTime: `${stats.avgResolutionHours} hrs`,
        avgResolutionHours: stats.avgResolutionHours,
        resolutionRate: `${resolutionRate}%`,
        resolutionRateNumber: resolutionRate,
      },
      kpis: [
        {
          id: 'total',
          label: 'Total Department Volume',
          value: stats.total,
          subtitle: 'Incoming grievances',
          icon: '📁',
          variant: 'primary',
        },
        {
          id: 'pending_triage',
          label: 'Pending Review',
          value: stats.pending,
          subtitle: 'Unreviewed citizen submissions',
          icon: '🔍',
          variant: 'warning',
        },
        {
          id: 'in_progress',
          label: 'In Field Repair',
          value: stats.inProgress,
          subtitle: 'Active technician assignments',
          icon: '⚡',
          variant: 'primary',
        },
        {
          id: 'high_priority',
          label: 'High / Critical Priority',
          value: stats.highPriority,
          subtitle: 'Urgent attention required',
          icon: '🚨',
          variant: 'danger',
        },
        {
          id: 'avg_resolution',
          label: 'Avg Resolution Time',
          value: `${stats.avgResolutionHours} hrs`,
          subtitle: 'SLA target: < 24 hrs',
          icon: '⏱️',
          variant: 'success',
        },
      ],
      statusDistribution: stats.statusCounts,
      categoryDistribution: stats.categoryCounts,
      priorityDistribution: stats.priorityCounts,
      topWorkers: stats.topWorkers,
      satisfaction: stats.satisfaction,
    };
  }

  // =========================================================================
  // WORKER DASHBOARD
  // =========================================================================

  /**
   * Field technician dashboard statistics
   */
  async getWorkerDashboard(user) {
    const stats = await analyticsRepository.getWorkerStats(user.id);

    return {
      role: 'WORKER',
      worker: {
        id: user.id,
        name: stats.name,
        department: stats.department,
        dutyStatus: stats.dutyStatus,
        isAvailable: stats.isAvailable,
      },
      summary: {
        assignedComplaints: stats.assignedComplaints,
        activeComplaints: stats.activeComplaints,
        completedComplaints: stats.completedComplaints,
        workload: stats.workload,
        averageResolutionTime: `${stats.avgResolutionHours} hrs`,
        avgResolutionHours: stats.avgResolutionHours,
      },
      kpis: [
        {
          id: 'pending_acceptance',
          label: 'Pending Acceptance',
          value: stats.workload.pendingAcceptance,
          subtitle: 'New orders requiring confirmation',
          icon: '📥',
          variant: 'warning',
        },
        {
          id: 'in_progress',
          label: 'Work In Progress',
          value: stats.workload.inProgress,
          subtitle: 'Active field operations',
          icon: '🔨',
          variant: 'primary',
        },
        {
          id: 'completed',
          label: 'Completed Repairs',
          value: stats.completedComplaints,
          subtitle: 'Resolved and closed',
          icon: '✅',
          variant: 'success',
        },
        {
          id: 'capacity',
          label: 'Capacity Load',
          value: `${stats.workload.capacityLoadPercentage}%`,
          subtitle: 'Workforce capacity utilization',
          icon: '📊',
          variant: stats.workload.capacityLoadPercentage > 75 ? 'danger' : 'primary',
        },
      ],
      recentTasks: stats.recentTasks,
    };
  }

  // =========================================================================
  // ADMIN DASHBOARD
  // =========================================================================

  /**
   * System-wide administration analytics dashboard
   */
  async getAdminDashboard(query = {}) {
    const stats = await analyticsRepository.getAdminStats({
      months: query.months || 12,
    });

    return {
      role: 'ADMIN',
      summary: {
        totalUsers: stats.users.total,
        citizens: stats.users.citizens,
        workers: stats.users.workers,
        authorities: stats.users.authorities,
        totalComplaints: stats.complaints.total,
        resolvedComplaints: stats.complaints.resolved,
        pendingComplaints: stats.complaints.pending,
        activeComplaints: stats.complaints.active,
        resolutionRate: `${stats.complaints.resolutionRate}%`,
        resolutionRateNumber: stats.complaints.resolutionRate,
        averageResolutionTime: `${stats.complaints.avgResolutionHours} hrs`,
        avgResolutionHours: stats.complaints.avgResolutionHours,
      },
      users: stats.users,
      complaints: stats.complaints,
      complaintsByCategory: stats.complaints.byCategory,
      complaintsByStatus: stats.complaints.byStatus,
      complaintsByPriority: stats.complaints.byPriority,
      complaintsOverTime: stats.timeSeries,
      satisfaction: stats.satisfaction,
      assignments: stats.assignments,
      kpis: [
        {
          id: 'total_grievances',
          label: 'Total Citizen Grievances',
          value: stats.complaints.total,
          subtitle: `${stats.complaints.active} Active • ${stats.complaints.resolved} Resolved`,
          icon: '📋',
          variant: 'primary',
        },
        {
          id: 'resolution_rate',
          label: 'Resolution Rate',
          value: `${stats.complaints.resolutionRate}%`,
          subtitle: 'Platform resolution compliance',
          icon: '⚡',
          variant: 'success',
        },
        {
          id: 'avg_resolution_time',
          label: 'Avg Resolution Time',
          value: `${stats.complaints.avgResolutionHours} hrs`,
          subtitle: 'Average turnaround velocity',
          icon: '⏱️',
          variant: 'primary',
        },
        {
          id: 'total_citizens',
          label: 'Registered Citizens',
          value: stats.users.citizens,
          subtitle: `${stats.users.total} total platform accounts`,
          icon: '👥',
          variant: 'warning',
        },
      ],
    };
  }
}

module.exports = new AnalyticsService();

