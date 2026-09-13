import { apiClient } from './apiClient.js'

export const NOTIFICATION_TYPES = {
  COMPLAINT_CREATED: 'COMPLAINT_CREATED',
  COMPLAINT_ASSIGNED: 'COMPLAINT_ASSIGNED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  WORK_UPDATE: 'WORK_UPDATE',
  COMPLAINT_RESOLVED: 'COMPLAINT_RESOLVED',
  FEEDBACK_SUBMITTED: 'FEEDBACK_SUBMITTED',
}

export const notificationService = {
  /**
   * Fetch notifications for authenticated user
   */
  async getNotifications(filtersOrUserId = {}, role = null) {
    const params = new URLSearchParams()
    if (typeof filtersOrUserId === 'object' && filtersOrUserId !== null) {
      if (filtersOrUserId.page) params.append('page', filtersOrUserId.page)
      if (filtersOrUserId.limit) params.append('limit', filtersOrUserId.limit)
      if (filtersOrUserId.unreadOnly) params.append('unreadOnly', filtersOrUserId.unreadOnly)
    }

    const queryString = params.toString() ? `?${params.toString()}` : ''
    try {
      const res = await apiClient.get(`/notifications${queryString}`)
      const payload = res.data?.data || res.data || {}
      const items =
        payload.notifications ||
        payload.items ||
        res.data?.notifications ||
        (Array.isArray(payload) ? payload : [])
      return Array.isArray(items) ? items : []
    } catch {
      return []
    }
  },

  /**
   * Get unread count
   */
  async getUnreadCount() {
    try {
      const res = await apiClient.get('/notifications?unreadOnly=true')
      const payload = res.data?.data || res.data || {}
      const items =
        payload.notifications ||
        payload.items ||
        res.data?.notifications ||
        (Array.isArray(payload) ? payload : [])
      const list = Array.isArray(items) ? items : []
      return list.filter((n) => !n.isRead && !n.read).length
    } catch {
      return 0
    }
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id) {
    try {
      const res = await apiClient.patch(`/notifications/${id}/read`)
      return res.data?.data || res.data
    } catch {
      return { success: true }
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const res = await apiClient.patch('/notifications/read-all')
      return res.data?.data || res.data
    } catch {
      return { success: true }
    }
  },

  /**
   * Client-side dispatch stubs (backend handles notifications on-event)
   */
  async createNotification(notificationData) {
    return { id: `notif_${Date.now()}`, ...notificationData, createdAt: new Date().toISOString() }
  },

  async notifyComplaintCreated(complaint, citizenUser = null) {
    return true
  },

  async notifyStatusChanged(complaint, newStatus, actor = null, notes = '') {
    return true
  },

  async notifyWorkerAssigned(complaint, worker, actor = null) {
    return true
  },

  async notifyFeedbackSubmitted(complaint, rating, citizenName, comment) {
    return true
  },

  async notifyWorkerProgress(complaint, worker, notes, materialsUsed) {
    return true
  },
}
