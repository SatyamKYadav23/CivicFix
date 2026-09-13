import { NOTIFICATION_TYPES } from '../utils/constants.js'

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    userId: 'usr-1',
    role: 'CITIZEN',
    type: NOTIFICATION_TYPES.WORKER_ASSIGNED,
    title: 'Worker Assigned to your complaint',
    message: 'Raj Kumar has been assigned to "Broken street light at 4th Cross Main Gate".',
    targetId: 'CF-1001',
    read: false,
    createdAt: '2026-08-23T08:30:00.000Z',
  },
  {
    id: 'notif-2',
    userId: 'usr-1',
    role: 'CITIZEN',
    type: NOTIFICATION_TYPES.COMPLAINT_RESOLVED,
    title: 'Complaint Resolved — Please Rate',
    message: 'Work has been completed for "Deep pothole near school zone". Please share feedback.',
    targetId: 'CF-1004',
    read: false,
    createdAt: '2026-08-23T17:00:00.000Z',
  },
  {
    id: 'notif-3',
    userId: 'usr-3',
    role: 'AUTHORITY',
    type: NOTIFICATION_TYPES.COMPLAINT_CREATED,
    title: 'New Critical Complaint Reported',
    message: 'Water pipe leakage reported in Sector 8 Market requires immediate review.',
    targetId: 'CF-1002',
    read: false,
    createdAt: '2026-08-24T14:20:00.000Z',
  },
  {
    id: 'notif-4',
    userId: 'usr-4',
    role: 'WORKER',
    type: NOTIFICATION_TYPES.WORKER_ASSIGNED,
    title: 'New Field Task Assigned',
    message: 'You have been assigned to repair "Broken street light at 4th Cross Main Gate".',
    targetId: 'CF-1001',
    read: false,
    createdAt: '2026-08-23T08:30:00.000Z',
  },
]

