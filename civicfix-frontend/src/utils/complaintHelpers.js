import { COMPLAINT_STATUSES, COMPLAINT_PRIORITIES } from './constants.js'

/**
 * Returns human-readable label for a status
 */
export function getStatusLabel(status) {
  switch (status) {
    case COMPLAINT_STATUSES.REPORTED:
    case COMPLAINT_STATUSES.SUBMITTED:
      return 'Submitted'
    case COMPLAINT_STATUSES.UNDER_REVIEW:
      return 'Under Review'
    case COMPLAINT_STATUSES.ASSIGNED:
      return 'Assigned'
    case COMPLAINT_STATUSES.IN_PROGRESS:
      return 'In Progress'
    case COMPLAINT_STATUSES.RESOLVED:
      return 'Pending Verification'
    case COMPLAINT_STATUSES.CLOSED:
      return 'Closed'
    case COMPLAINT_STATUSES.REJECTED:
      return 'Rejected'
    case COMPLAINT_STATUSES.DUPLICATE:
      return 'Duplicate'
    case COMPLAINT_STATUSES.REOPENED:
      return 'Reopened'
    default:
      return status || 'Unknown'
  }
}

/**
 * Returns the UI Badge variant for a complaint status
 */
export function getStatusBadgeVariant(status) {
  switch (status) {
    case COMPLAINT_STATUSES.REPORTED:
    case COMPLAINT_STATUSES.SUBMITTED:
      return 'neutral'
    case COMPLAINT_STATUSES.UNDER_REVIEW:
      return 'warning'
    case COMPLAINT_STATUSES.ASSIGNED:
      return 'primary'
    case COMPLAINT_STATUSES.IN_PROGRESS:
      return 'primary'
    case COMPLAINT_STATUSES.RESOLVED:
      return 'success'
    case COMPLAINT_STATUSES.CLOSED:
      return 'neutral'
    case COMPLAINT_STATUSES.REJECTED:
      return 'danger'
    case COMPLAINT_STATUSES.DUPLICATE:
      return 'warning'
    case COMPLAINT_STATUSES.REOPENED:
      return 'warning'
    default:
      return 'neutral'
  }
}

export const getStatusVariant = getStatusBadgeVariant


/**
 * Returns the status color token / accent class
 */
export function getStatusTone(status) {
  switch (status) {
    case COMPLAINT_STATUSES.REPORTED:
      return 'neutral'
    case COMPLAINT_STATUSES.UNDER_REVIEW:
      return 'warning'
    case COMPLAINT_STATUSES.ASSIGNED:
      return 'info'
    case COMPLAINT_STATUSES.IN_PROGRESS:
      return 'primary'
    case COMPLAINT_STATUSES.RESOLVED:
      return 'success'
    case COMPLAINT_STATUSES.CLOSED:
      return 'neutral'
    case COMPLAINT_STATUSES.REJECTED:
      return 'danger'
    case COMPLAINT_STATUSES.DUPLICATE:
      return 'warning'
    default:
      return 'neutral'
  }
}

/**
 * Returns human-readable label for a priority
 */
export function getPriorityLabel(priority) {
  switch (priority) {
    case COMPLAINT_PRIORITIES.LOW:
      return 'Low'
    case COMPLAINT_PRIORITIES.MEDIUM:
      return 'Medium'
    case COMPLAINT_PRIORITIES.HIGH:
      return 'High'
    case COMPLAINT_PRIORITIES.CRITICAL:
      return 'Critical'
    default:
      return priority || 'Medium'
  }
}

/**
 * Returns the UI Badge variant for a priority
 */
export function getPriorityBadgeVariant(priority) {
  switch (priority) {
    case COMPLAINT_PRIORITIES.LOW:
      return 'neutral'
    case COMPLAINT_PRIORITIES.MEDIUM:
      return 'primary'
    case COMPLAINT_PRIORITIES.HIGH:
      return 'warning'
    case COMPLAINT_PRIORITIES.CRITICAL:
      return 'danger'
    default:
      return 'neutral'
  }
}

export const getPriorityVariant = getPriorityBadgeVariant

/**
 * Validates whether a status transition is permitted by workflow rules
 */
export function canTransition(currentStatus, targetStatus) {
  const allowedTransitions = {
    [COMPLAINT_STATUSES.REPORTED]: [
      COMPLAINT_STATUSES.UNDER_REVIEW,
      COMPLAINT_STATUSES.REJECTED,
      COMPLAINT_STATUSES.DUPLICATE,
    ],
    [COMPLAINT_STATUSES.UNDER_REVIEW]: [
      COMPLAINT_STATUSES.ASSIGNED,
      COMPLAINT_STATUSES.REJECTED,
      COMPLAINT_STATUSES.DUPLICATE,
    ],
    [COMPLAINT_STATUSES.ASSIGNED]: [
      COMPLAINT_STATUSES.IN_PROGRESS,
      COMPLAINT_STATUSES.UNDER_REVIEW,
    ],
    [COMPLAINT_STATUSES.IN_PROGRESS]: [
      COMPLAINT_STATUSES.RESOLVED,
      COMPLAINT_STATUSES.UNDER_REVIEW,
    ],
    [COMPLAINT_STATUSES.RESOLVED]: [
      COMPLAINT_STATUSES.CLOSED,
      COMPLAINT_STATUSES.UNDER_REVIEW,
    ],
    [COMPLAINT_STATUSES.CLOSED]: [],
    [COMPLAINT_STATUSES.REJECTED]: [],
    [COMPLAINT_STATUSES.DUPLICATE]: [],
  }

  return allowedTransitions[currentStatus]?.includes(targetStatus) ?? false
}

/**
 * Returns permitted next statuses for a given status and role
 */
export function getNextPermittedStatuses(currentStatus, role = 'AUTHORITY') {
  if (role === 'CITIZEN') {
    if (currentStatus === COMPLAINT_STATUSES.RESOLVED) {
      return [COMPLAINT_STATUSES.CLOSED]
    }
    return []
  }

  if (role === 'WORKER') {
    if (currentStatus === COMPLAINT_STATUSES.ASSIGNED) {
      return [COMPLAINT_STATUSES.IN_PROGRESS]
    }
    if (currentStatus === COMPLAINT_STATUSES.IN_PROGRESS) {
      return [COMPLAINT_STATUSES.RESOLVED]
    }
    return []
  }

  // AUTHORITY & ADMIN
  switch (currentStatus) {
    case COMPLAINT_STATUSES.REPORTED:
      return [COMPLAINT_STATUSES.UNDER_REVIEW, COMPLAINT_STATUSES.REJECTED, COMPLAINT_STATUSES.DUPLICATE]
    case COMPLAINT_STATUSES.UNDER_REVIEW:
      return [COMPLAINT_STATUSES.ASSIGNED, COMPLAINT_STATUSES.REJECTED, COMPLAINT_STATUSES.DUPLICATE]
    case COMPLAINT_STATUSES.ASSIGNED:
      return [COMPLAINT_STATUSES.IN_PROGRESS, COMPLAINT_STATUSES.UNDER_REVIEW]
    case COMPLAINT_STATUSES.IN_PROGRESS:
      return [COMPLAINT_STATUSES.RESOLVED, COMPLAINT_STATUSES.UNDER_REVIEW]
    case COMPLAINT_STATUSES.RESOLVED:
      return [COMPLAINT_STATUSES.CLOSED, COMPLAINT_STATUSES.UNDER_REVIEW]
    default:
      return []
  }
}

/**
 * Standard lifecycle steps for timeline tracking
 */
export const LIFECYCLE_STEPS = [
  { id: COMPLAINT_STATUSES.REPORTED, label: 'Reported' },
  { id: COMPLAINT_STATUSES.UNDER_REVIEW, label: 'Under Review' },
  { id: COMPLAINT_STATUSES.ASSIGNED, label: 'Worker Assigned' },
  { id: COMPLAINT_STATUSES.IN_PROGRESS, label: 'In Progress' },
  { id: COMPLAINT_STATUSES.RESOLVED, label: 'Resolved' },
  { id: COMPLAINT_STATUSES.CLOSED, label: 'Closed' },
]
