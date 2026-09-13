const notificationRepository = require('../repositories/notification.repository');
const userRepository = require('../repositories/user.repository');
const { matchesJurisdiction } = require('./jurisdiction.helper');
const AppError = require('../utils/appError');
const {
  parsePagination,
  buildPaginationMeta,
  parseSorting,
  parseDateRange,
  parseMultiEnum,
} = require('../utils/queryHelper');

/**
 * Format raw notification record into complete API response structure
 * ensuring id, recipient, type, title, message, relatedComplaint, read/unread status, and createdAt
 */
function formatNotification(n) {
  if (!n) return null;
  return {
    id: n.id,
    recipient: n.user
      ? {
          id: n.user.id,
          name: n.user.name,
          email: n.user.email,
          role: n.user.role,
        }
      : n.userId,
    userId: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.read,
    isRead: n.read,
    targetId: n.targetId,
    complaintId: n.complaintId,
    relatedComplaint: n.complaint || null,
    complaint: n.complaint || null,
    createdAt: n.createdAt,
  };
}

/**
 * Notification Service - Dispatches in-app notifications and manages user alerts
 */
class NotificationService {
  /**
   * Format single notification record
   */
  formatNotification(n) {
    return formatNotification(n);
  }

  /**
   * 1. Complaint Created / Submitted
   * - Confirms submission to Citizen
   * - Alerts department/jurisdiction Authorities of new complaint
   */
  async notifyComplaintCreated(complaint, citizenUser = null) {
    // 1. Confirm to Citizen
    if (complaint.citizenId || citizenUser?.id) {
      await notificationRepository.create({
        userId: complaint.citizenId || citizenUser.id,
        complaintId: complaint.id,
        type: 'COMPLAINT_CREATED',
        title: 'Complaint Registered',
        message: `Your complaint "${complaint.title}" has been registered in the municipal queue (Docket #${complaint.id.substring(0, 8)}).`,
        targetId: complaint.id,
      });
    }

    // 2. Alert Authorities matching jurisdiction
    try {
      const authorities = await userRepository.findMany({
        where: { role: 'AUTHORITY', status: 'ACTIVE' },
        take: 50,
      });

      const relevantAuthorities = authorities.filter((auth) =>
        matchesJurisdiction(complaint.category, auth.department)
      );

      for (const auth of relevantAuthorities) {
        await notificationRepository.create({
          userId: auth.id,
          complaintId: complaint.id,
          type: 'COMPLAINT_CREATED',
          title: 'New Complaint Reported',
          message: `New ${complaint.category} complaint reported at ${complaint.location}: "${complaint.title}". Priority: ${complaint.priority}.`,
          targetId: complaint.id,
        });
      }
    } catch (err) {
      console.error('[NotificationService] Failed to notify authorities of new complaint:', err.message);
    }
  }

  /**
   * 2. Worker Assigned
   * - Notifies Citizen of dispatched technician
   * - Notifies Worker of new field assignment
   * - If reassigned from a previous worker, notifies previous worker
   */
  async notifyWorkerAssigned(complaint, worker, authority = null, previousWorkerId = null) {
    const authorityName = authority?.name || 'Authority Officer';
    const workerName = worker?.name || 'Technician';

    // 1. Notify Citizen
    if (complaint.citizenId) {
      await notificationRepository.create({
        userId: complaint.citizenId,
        complaintId: complaint.id,
        type: 'WORKER_ASSIGNED',
        title: 'Technician Dispatched',
        message: `Field technician ${workerName} (${worker.department || 'Field Division'}) has been assigned to investigate and resolve your report: "${complaint.title}".`,
        targetId: complaint.id,
      });
    }

    // 2. Notify Assigned Worker
    if (worker?.id) {
      await notificationRepository.create({
        userId: worker.id,
        complaintId: complaint.id,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assignment',
        message: `${authorityName} assigned you to complaint #${complaint.id.substring(0, 8)}: "${complaint.title}" at ${complaint.location}. Priority: ${complaint.priority}.`,
        targetId: complaint.id,
      });
    }

    // 3. Notify Previous Worker if reassigned
    if (previousWorkerId && previousWorkerId !== worker?.id) {
      await notificationRepository.create({
        userId: previousWorkerId,
        complaintId: complaint.id,
        type: 'ASSIGNMENT_CHANGED',
        title: 'Assignment Updated',
        message: `Your assignment for complaint #${complaint.id.substring(0, 8)}: "${complaint.title}" has been reassigned to ${workerName}.`,
        targetId: complaint.id,
      });
    }
  }

  /**
   * 3. Worker Started Work
   * - Notifies Citizen technician commenced on-site work
   * - Notifies Authority of on-site commencement
   */
  async notifyWorkStarted(complaint, worker) {
    const workerName = worker?.name || 'Assigned technician';

    // 1. Notify Citizen
    if (complaint.citizenId) {
      await notificationRepository.create({
        userId: complaint.citizenId,
        complaintId: complaint.id,
        type: 'STATUS_UPDATED',
        title: 'Work In Progress',
        message: `Technician ${workerName} has arrived on site and commenced repairs for: "${complaint.title}".`,
        targetId: complaint.id,
      });
    }

    // 2. Notify Assigned Authority
    if (complaint.assignedAuthorityId) {
      await notificationRepository.create({
        userId: complaint.assignedAuthorityId,
        complaintId: complaint.id,
        type: 'STATUS_UPDATED',
        title: 'Technician Commenced Work',
        message: `Technician ${workerName} started on-site work on docket #${complaint.id.substring(0, 8)}: "${complaint.title}".`,
        targetId: complaint.id,
      });
    }
  }

  /**
   * 4. Resolution Submitted
   * - Notifies Authority that worker submitted repair proof for sign-off
   */
  async notifyResolutionSubmitted(complaint, worker) {
    const workerName = worker?.name || 'Technician';

    if (complaint.assignedAuthorityId) {
      await notificationRepository.create({
        userId: complaint.assignedAuthorityId,
        complaintId: complaint.id,
        type: 'COMPLETION_PENDING_REVIEW',
        title: 'Repair Completion Submitted',
        message: `Technician ${workerName} submitted completion proof for docket #${complaint.id.substring(0, 8)}: "${complaint.title}". Review and sign off.`,
        targetId: complaint.id,
      });
    }
  }

  /**
   * 5. Worker Completed Assignment
   * - Notifies Authority worker finished their task
   */
  async notifyWorkerCompletedAssignment(complaint, worker) {
    const workerName = worker?.name || 'Technician';

    if (complaint.assignedAuthorityId) {
      await notificationRepository.create({
        userId: complaint.assignedAuthorityId,
        complaintId: complaint.id,
        type: 'WORKER_COMPLETED_ASSIGNMENT',
        title: 'Worker Completed Assignment',
        message: `Technician ${workerName} completed the repair task for docket #${complaint.id.substring(0, 8)}: "${complaint.title}".`,
        targetId: complaint.id,
      });
    }
  }

  /**
   * 6. Complaint Resolved
   * - Notifies Citizen issue is resolved and invites feedback
   * - Notifies Authority if resolved by worker or admin
   */
  async notifyComplaintResolved(complaint, actor = null) {
    // 1. Notify Citizen
    if (complaint.citizenId) {
      await notificationRepository.create({
        userId: complaint.citizenId,
        complaintId: complaint.id,
        type: 'COMPLAINT_RESOLVED',
        title: 'Grievance Resolved — Feedback Requested',
        message: `Your report "${complaint.title}" has been marked resolved. Please inspect the completed fix and provide satisfaction feedback.`,
        targetId: complaint.id,
      });
    }

    // 2. Notify Authority if resolved by another actor
    if (complaint.assignedAuthorityId && actor && actor.id !== complaint.assignedAuthorityId) {
      await notificationRepository.create({
        userId: complaint.assignedAuthorityId,
        complaintId: complaint.id,
        type: 'COMPLAINT_RESOLVED',
        title: 'Complaint Marked Resolved',
        message: `Docket #${complaint.id.substring(0, 8)}: "${complaint.title}" has been marked resolved by ${actor.name} (${actor.role}).`,
        targetId: complaint.id,
      });
    }
  }

  /**
   * 7. Complaint Rejected
   * - Notifies Citizen that complaint was reviewed and rejected with reason
   */
  async notifyComplaintRejected(complaint, notes = '', actor = null) {
    if (!complaint.citizenId) return;

    await notificationRepository.create({
      userId: complaint.citizenId,
      complaintId: complaint.id,
      type: 'COMPLAINT_REJECTED',
      title: 'Complaint Rejected',
      message: `Your complaint "${complaint.title}" was reviewed and marked REJECTED.${notes ? ` Reason: "${notes}"` : ' Please check municipal guidelines or submit an appeal.'}`,
      targetId: complaint.id,
    });
  }

  /**
   * 8. Complaint Reopened
   * - Notifies Citizen confirming appeal/reopening
   * - Notifies Authority that complaint was reopened
   * - Notifies Worker if previously assigned
   */
  async notifyComplaintReopened(complaint, citizen = null, notes = '') {
    const citizenName = citizen?.name || 'Citizen';

    // 1. Confirm to Citizen
    if (complaint.citizenId) {
      await notificationRepository.create({
        userId: complaint.citizenId,
        complaintId: complaint.id,
        type: 'COMPLAINT_REOPENED',
        title: 'Complaint Reopened',
        message: `Your complaint "${complaint.title}" has been reopened for further investigation and review.`,
        targetId: complaint.id,
      });
    }

    // 2. Alert Assigned Authority or department authorities
    if (complaint.assignedAuthorityId) {
      await notificationRepository.create({
        userId: complaint.assignedAuthorityId,
        complaintId: complaint.id,
        type: 'COMPLAINT_REOPENED',
        title: 'Complaint Reopened by Citizen',
        message: `Docket #${complaint.id.substring(0, 8)} ("${complaint.title}") was reopened by ${citizenName}.${notes ? ` Notes: "${notes}"` : ''}`,
        targetId: complaint.id,
      });
    }

    // 3. Alert Assigned Worker if set
    if (complaint.assignedWorkerId) {
      await notificationRepository.create({
        userId: complaint.assignedWorkerId,
        complaintId: complaint.id,
        type: 'COMPLAINT_REOPENED',
        title: 'Assigned Task Reopened',
        message: `Complaint #${complaint.id.substring(0, 8)} ("${complaint.title}") has been reopened for follow-up inspection.`,
        targetId: complaint.id,
      });
    }
  }

  /**
   * 9. Citizen Feedback Submitted
   * - Notifies Authority and Worker of star rating and comments
   */
  async notifyFeedbackSubmitted(complaint, rating, citizen = null, comment = '') {
    const citizenName = citizen?.name || 'Citizen';
    const message = `${citizenName} provided a ${rating}-star review for docket #${complaint.id.substring(0, 8)}: "${complaint.title}".${comment ? ` "${comment}"` : ''}`;

    // 1. Notify Authority
    if (complaint.assignedAuthorityId) {
      await notificationRepository.create({
        userId: complaint.assignedAuthorityId,
        complaintId: complaint.id,
        type: 'FEEDBACK_SUBMITTED',
        title: 'Citizen Feedback Received',
        message,
        targetId: complaint.id,
      });
    }

    // 2. Notify Worker
    if (complaint.assignedWorkerId) {
      await notificationRepository.create({
        userId: complaint.assignedWorkerId,
        complaintId: complaint.id,
        type: 'FEEDBACK_SUBMITTED',
        title: 'Citizen Rated Your Work',
        message: `Citizen ${citizenName} rated your repair on "${complaint.title}" with ${rating} stars!${comment ? ` "${comment}"` : ''}`,
        targetId: complaint.id,
      });
    }
  }

  /**
   * 10. Generic Status Changed
   * - Notifies Citizen of intermediate status transitions (e.g. UNDER_REVIEW)
   */
  async notifyStatusChanged(complaint, newStatus, actor = null, notes = '') {
    if (newStatus === 'RESOLVED') {
      return this.notifyComplaintResolved(complaint, actor);
    }
    if (newStatus === 'REJECTED') {
      return this.notifyComplaintRejected(complaint, notes, actor);
    }
    if (newStatus === 'REOPENED') {
      return this.notifyComplaintReopened(complaint, actor, notes);
    }

    if (complaint.citizenId) {
      await notificationRepository.create({
        userId: complaint.citizenId,
        complaintId: complaint.id,
        type: 'STATUS_UPDATED',
        title: `Complaint Status: ${newStatus}`,
        message: `Your complaint "${complaint.title}" status is now ${newStatus}.${notes ? ` Notes: "${notes}"` : ''}`,
        targetId: complaint.id,
      });
    }
  }

  /**
   * Retrieve notifications for a user with formatting and unread count
   */
  /**
   * Retrieve notifications for a user with formatting and unread count
   */
  async getUserNotifications(userId, query = {}) {
    const { page, limit, skip } = parsePagination(query, 20, 100);
    const { orderBy, sortBy, sortOrder } = parseSorting(
      query,
      ['createdAt', 'read', 'type', 'title'],
      'createdAt',
      'desc'
    );
    const dateRange = parseDateRange(query, 'createdAt');

    const where = { ...dateRange };

    if (query.read === 'true' || query.read === true) where.read = true;
    if (query.read === 'false' || query.read === false) where.read = false;
    if (query.unreadOnly === 'true' || query.unreadOnly === true) where.read = false;

    if (query.type) {
      const types = parseMultiEnum(query.type);
      if (types && types.length > 0) {
        where.type = types.length === 1 ? types[0] : { in: types };
      }
    }

    if (query.search && query.search.trim() !== '') {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q } },
        { message: { contains: q } },
      ];
    }

    const [rawNotifications, total, unreadCount] = await Promise.all([
      notificationRepository.findByUser(userId, { where, skip, take: limit, orderBy }),
      notificationRepository.count({ userId, ...where }),
      notificationRepository.countUnread(userId),
    ]);

    const notifications = rawNotifications.map(formatNotification);
    const pagination = buildPaginationMeta(total, page, limit);

    return {
      notifications,
      unreadCount,
      pagination,
    };
  }

  /**
   * Mark a notification as read with ownership validation
   */
  async markAsRead(userId, notificationId) {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    if (notification.userId !== userId) {
      throw new AppError('Access denied: You cannot mark another user\'s notification as read', 403);
    }

    await notificationRepository.markAsRead(userId, notificationId);
    return { id: notificationId, read: true };
  }

  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(userId) {
    await notificationRepository.markAllAsRead(userId);
    return { success: true, message: 'All notifications marked as read' };
  }
}

module.exports = new NotificationService();

