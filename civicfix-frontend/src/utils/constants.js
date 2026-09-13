// Complaint lifecycle statuses (§20 — newTask.md)
export const COMPLAINT_STATUSES = {
  REPORTED: 'REPORTED',       // Citizen submitted (used as SUBMITTED equivalent in mock layer)
  SUBMITTED: 'SUBMITTED',     // Alias for backend compatibility
  UNDER_REVIEW: 'UNDER_REVIEW',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REOPENED: 'REOPENED',
  REJECTED: 'REJECTED',
  DUPLICATE: 'DUPLICATE',
}

// Worker task statuses — separate from complaint status (§20)
export const TASK_STATUSES = {
  ASSIGNED: 'ASSIGNED',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
}

export const COMPLAINT_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
}

export const USER_ROLES = {
  CITIZEN: 'CITIZEN',
  AUTHORITY: 'AUTHORITY',
  WORKER: 'WORKER',
  ADMIN: 'ADMIN',
}

// Complaint categories aligned with departmental authorities (§6, §18)
export const CATEGORIES = [
  { id: 'roads', label: 'Roads & Potholes' },
  { id: 'streetlights', label: 'Street Lighting' },
  { id: 'water', label: 'Water Supply & Leakage' },
  { id: 'sanitation', label: 'Sanitation & Waste' },
  { id: 'drainage', label: 'Drainage & Sewage' },
  { id: 'parks', label: 'Parks & Public Spaces' },
  { id: 'transport', label: 'Public Transport & Traffic' },
  { id: 'other', label: 'Other Civic Issues' },
]

export const NOTIFICATION_TYPES = {
  COMPLAINT_CREATED: 'COMPLAINT_CREATED',
  WORKER_ASSIGNED: 'WORKER_ASSIGNED',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  STATUS_UPDATED: 'STATUS_UPDATED',
  COMPLAINT_RESOLVED: 'COMPLAINT_RESOLVED',
  COMPLETION_PENDING_REVIEW: 'COMPLETION_PENDING_REVIEW',
  COMPLETION_APPROVED: 'COMPLETION_APPROVED',
  COMPLETION_REJECTED: 'COMPLETION_REJECTED',
  FEEDBACK_SUBMITTED: 'FEEDBACK_SUBMITTED',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
}

// Worker duty & availability states (§35)
export const WORKER_AVAILABILITY = {
  AVAILABLE: 'AVAILABLE',
  BUSY: 'BUSY',
  OFFLINE: 'OFFLINE',
  ON_LEAVE: 'ON_LEAVE',
  INACTIVE: 'INACTIVE',
}
