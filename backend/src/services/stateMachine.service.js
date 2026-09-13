const complaintRepository = require('../repositories/complaint.repository');
const assignmentRepository = require('../repositories/assignment.repository');
const historyRepository = require('../repositories/history.repository');
const notificationService = require('./notification.service');
const { matchesJurisdiction } = require('./jurisdiction.helper');
const AppError = require('../utils/appError');

/**
 * Transition rules mapping each current state to permitted target states and authorized roles
 */
const TRANSITION_RULES = {
  SUBMITTED: [
    { target: 'UNDER_REVIEW', allowedRoles: ['AUTHORITY', 'ADMIN'] },
    { target: 'ASSIGNED', allowedRoles: ['AUTHORITY', 'ADMIN'] },
    { target: 'CANCELLED', allowedRoles: ['CITIZEN', 'ADMIN'] },
    { target: 'REJECTED', allowedRoles: ['AUTHORITY', 'ADMIN'] },
  ],
  UNDER_REVIEW: [
    { target: 'ASSIGNED', allowedRoles: ['AUTHORITY', 'ADMIN'] },
    { target: 'REJECTED', allowedRoles: ['AUTHORITY', 'ADMIN'] },
    { target: 'CANCELLED', allowedRoles: ['CITIZEN', 'ADMIN'] },
  ],
  ASSIGNED: [
    { target: 'ASSIGNED', allowedRoles: ['WORKER', 'AUTHORITY', 'ADMIN'] }, // e.g. taskStatus ACCEPTED or reassignment
    { target: 'IN_PROGRESS', allowedRoles: ['WORKER', 'AUTHORITY', 'ADMIN'] },
    { target: 'RESOLVED', allowedRoles: ['AUTHORITY', 'ADMIN'] }, // Authority/Admin administrative resolution
    { target: 'UNDER_REVIEW', allowedRoles: ['AUTHORITY', 'ADMIN'] },
    { target: 'CANCELLED', allowedRoles: ['ADMIN'] },
  ],
  IN_PROGRESS: [
    { target: 'RESOLUTION_SUBMITTED', allowedRoles: ['WORKER', 'AUTHORITY', 'ADMIN'] },
    { target: 'RESOLVED', allowedRoles: ['WORKER', 'AUTHORITY', 'ADMIN'] },
    { target: 'ASSIGNED', allowedRoles: ['AUTHORITY', 'ADMIN'] }, // Reassigning
  ],
  RESOLUTION_SUBMITTED: [
    { target: 'RESOLVED', allowedRoles: ['AUTHORITY', 'ADMIN'] }, // Authority approves resolution
    { target: 'IN_PROGRESS', allowedRoles: ['AUTHORITY', 'ADMIN'] }, // Authority rejects; sends back for rework
    { target: 'CLOSED', allowedRoles: ['AUTHORITY', 'ADMIN'] },
  ],
  RESOLVED: [
    { target: 'CLOSED', allowedRoles: ['CITIZEN', 'AUTHORITY', 'ADMIN'] }, // Citizen provides feedback or Authority closes
    { target: 'REOPENED', allowedRoles: ['CITIZEN', 'ADMIN'] }, // Citizen rework appeal
    { target: 'IN_PROGRESS', allowedRoles: ['AUTHORITY', 'ADMIN'] }, // Authority rework
  ],
  CLOSED: [
    { target: 'REOPENED', allowedRoles: ['CITIZEN', 'ADMIN'] }, // Reopen closed issue
  ],
  REOPENED: [
    { target: 'UNDER_REVIEW', allowedRoles: ['AUTHORITY', 'ADMIN'] },
    { target: 'ASSIGNED', allowedRoles: ['AUTHORITY', 'ADMIN'] },
    { target: 'IN_PROGRESS', allowedRoles: ['AUTHORITY', 'ADMIN'] },
  ],
  REJECTED: [
    { target: 'REOPENED', allowedRoles: ['CITIZEN', 'ADMIN'] }, // Citizen appeal with justification
  ],
  CANCELLED: [], // Terminal state
};

/**
 * State Machine Service - Enforces valid workflow transitions and integrity rules
 */
class StateMachineService {
  /**
   * Validate that a user can transition a complaint from its current status to targetStatus
   */
  validateTransition(complaint, targetStatus, user) {
    if (!complaint) {
      throw new AppError('Complaint not found', 404);
    }

    const currentStatus = complaint.status;
    const target = targetStatus.toUpperCase();

    // 1. Check ownership & role permissions
    if (user.role === 'CITIZEN') {
      if (complaint.citizenId !== user.id) {
        throw new AppError('Forbidden: You can only modify your own complaints.', 403);
      }
    } else if (user.role === 'WORKER') {
      if (complaint.assignedWorkerId !== user.id && user.role !== 'ADMIN') {
        throw new AppError('Forbidden: You can only update complaints assigned to you.', 403);
      }
    } else if (user.role === 'AUTHORITY') {
      if (!matchesJurisdiction(complaint.category, user.department)) {
        throw new AppError(
          `Forbidden: You do not have jurisdiction over ${complaint.category} complaints.`,
          403
        );
      }
    }

    // 2. Check transition state matrix
    const allowedTransitions = TRANSITION_RULES[currentStatus] || [];
    const validTargets = allowedTransitions.map((t) => t.target);

    // If same status (e.g. updating notes without changing status)
    if (currentStatus === target && currentStatus !== 'ASSIGNED') {
      return true;
    }

    if (!validTargets.includes(target)) {
      throw new AppError(
        `Invalid status transition: Cannot move complaint from '${currentStatus}' to '${target}'. Allowed transitions: [${validTargets.join(
          ', '
        )}]`,
        400
      );
    }

    const matchingRule = allowedTransitions.find(
      (r) => r.target === target && r.allowedRoles.includes(user.role)
    );

    if (!matchingRule) {
      throw new AppError(
        `Forbidden: Users with role '${user.role}' are not permitted to transition complaint from '${currentStatus}' to '${target}'.`,
        403
      );
    }

    return true;
  }

  /**
   * Execute state transition atomically: updates complaint, assignment, history, and notifications
   */
  async executeTransition(
    complaintId,
    targetStatus,
    user,
    { notes, materialsUsed, action = 'STATUS_CHANGE', taskStatus = null } = {}
  ) {
    const complaint = await complaintRepository.findById(complaintId);
    if (!complaint) {
      throw new AppError(`Complaint with ID ${complaintId} not found`, 404);
    }

    // Validate transition
    this.validateTransition(complaint, targetStatus, user);

    const fromStatus = complaint.status;
    const now = new Date();
    const updateData = {
      status: targetStatus,
    };

    if (taskStatus) {
      updateData.taskStatus = taskStatus;
    }

    // Manage milestone timestamps
    if (targetStatus === 'RESOLVED' && fromStatus !== 'RESOLVED') {
      updateData.resolvedAt = now;
      updateData.taskStatus = 'COMPLETED';
      if (notes) updateData.resolutionNotes = notes;
    } else if (targetStatus === 'RESOLUTION_SUBMITTED') {
      updateData.taskStatus = 'COMPLETED';
      if (notes) updateData.resolutionNotes = notes;
    } else if (targetStatus === 'IN_PROGRESS' && fromStatus !== 'IN_PROGRESS') {
      updateData.startedAt = now;
      updateData.taskStatus = 'IN_PROGRESS';
    } else if (targetStatus === 'REOPENED') {
      updateData.resolvedAt = null;
      updateData.taskStatus = 'REOPENED';
    }

    if (materialsUsed) {
      updateData.materialsUsed = materialsUsed;
    }

    // Update complaint record
    await complaintRepository.update(complaintId, updateData);

    // Update active assignment if present
    const activeAssignment = await assignmentRepository.findActiveByComplaint(complaintId);
    if (activeAssignment) {
      const assignmentUpdates = {};
      if (targetStatus === 'IN_PROGRESS') {
        assignmentUpdates.status = 'IN_PROGRESS';
        assignmentUpdates.startedAt = now;
      } else if (targetStatus === 'RESOLVED' || targetStatus === 'RESOLUTION_SUBMITTED') {
        assignmentUpdates.status = 'COMPLETED';
        assignmentUpdates.completedAt = now;
      }
      if (Object.keys(assignmentUpdates).length > 0) {
        await assignmentRepository.update(activeAssignment.id, assignmentUpdates);
      }
    }

    // Record immutable audit history
    await historyRepository.create({
      complaintId,
      fromStatus,
      toStatus: targetStatus,
      action,
      notes: notes || `Status changed from ${fromStatus} to ${targetStatus} by ${user.name}`,
      actorId: user.id,
    });

    const refreshed = await complaintRepository.findById(complaintId);

    // Dispatch event-driven notifications
    if (targetStatus === 'RESOLVED') {
      await notificationService.notifyComplaintResolved(refreshed, user);
    } else if (targetStatus === 'IN_PROGRESS') {
      await notificationService.notifyWorkStarted(refreshed, user);
    } else if (targetStatus === 'RESOLUTION_SUBMITTED') {
      await notificationService.notifyResolutionSubmitted(refreshed, user);
    } else if (targetStatus === 'REJECTED') {
      await notificationService.notifyComplaintRejected(refreshed, notes, user);
    } else if (targetStatus === 'REOPENED') {
      await notificationService.notifyComplaintReopened(refreshed, user, notes);
    } else {
      await notificationService.notifyStatusChanged(refreshed, targetStatus, user, notes);
    }

    return refreshed;
  }
}

module.exports = new StateMachineService();
