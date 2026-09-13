import { apiClient } from './apiClient.js'

export const adminService = {
  /**
   * System-wide statistics
   */
  async getStats() {
    const res = await apiClient.get('/admin/stats')
    return res.data?.data || res.data || {}
  },

  /**
   * Comprehensive admin dashboard analytics
   */
  async getAnalytics() {
    const res = await apiClient.get('/admin/analytics')
    return res.data?.data || res.data || {}
  },

  /**
   * List users with filtering, search, and pagination
   */
  async getUsers(filters = {}) {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', filters.page)
    if (filters.limit) params.append('limit', filters.limit)
    if (filters.search) params.append('search', filters.search)
    if (filters.role && filters.role !== 'ALL') params.append('role', filters.role)
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status)
    if (filters.sortBy) params.append('sortBy', filters.sortBy)

    const queryString = params.toString() ? `?${params.toString()}` : ''
    const res = await apiClient.get(`/admin/users${queryString}`)

    const payload = res.data?.data || res.data || {}
    const items =
      payload.users ||
      payload.items ||
      res.data?.users ||
      (Array.isArray(payload) ? payload : [])

    const users = Array.isArray(items) ? [...items] : []
    users.pagination = res.data?.pagination || payload.pagination || null
    return users
  },

  /**
   * Create user administratively
   */
  async createUser(userData) {
    const res = await apiClient.post('/admin/users', userData)
    const payload = res.data?.data || res.data || {}
    return payload.user || payload
  },

  /**
   * Toggle or update user account status (ACTIVE / INACTIVE)
   */
  async updateUserStatus(id, { status, reason }) {
    const res = await apiClient.patch(`/admin/users/${id}/status`, {
      status,
      reason: reason || `Account status updated to ${status}`,
    })
    const payload = res.data?.data || res.data || {}
    return payload.user || payload
  },

  /**
   * Update user role and assignment details
   */
  async updateUserRole(id, { role, department, zone, designation, skills, reason }) {
    const res = await apiClient.patch(`/admin/users/${id}/role`, {
      role,
      department,
      zone,
      designation,
      skills,
      reason: reason || `Role updated to ${role}`,
    })
    const payload = res.data?.data || res.data || {}
    return payload.user || payload
  },

  /**
   * Search and filter platform complaints with full administrative oversight
   */
  async getComplaints(filters = {}) {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', filters.page)
    if (filters.limit) params.append('limit', filters.limit)
    if (filters.search) params.append('search', filters.search)
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status)
    if (filters.category && filters.category !== 'ALL') params.append('category', filters.category)
    if (filters.priority && filters.priority !== 'ALL') params.append('priority', filters.priority)
    if (filters.sortBy) params.append('sortBy', filters.sortBy)

    const queryString = params.toString() ? `?${params.toString()}` : ''
    const res = await apiClient.get(`/admin/complaints${queryString}`)

    const payload = res.data?.data || res.data || {}
    const items =
      payload.complaints ||
      payload.items ||
      res.data?.complaints ||
      (Array.isArray(payload) ? payload : [])

    const complaints = Array.isArray(items) ? [...items] : []
    complaints.pagination = res.data?.pagination || payload.pagination || null
    return complaints
  },

  /**
   * Administrative override on a complaint
   */
  async overrideComplaint(id, overrideData) {
    const res = await apiClient.patch(`/admin/complaints/${id}/override`, overrideData)
    const payload = res.data?.data || res.data || {}
    return payload.complaint || payload
  },

  /**
   * Retrieve immutable platform audit activity logs
   */
  async getAuditLogs(filters = {}) {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', filters.page)
    if (filters.limit) params.append('limit', filters.limit)
    if (filters.action && filters.action !== 'ALL') params.append('action', filters.action)
    if (filters.targetType && filters.targetType !== 'ALL') params.append('targetType', filters.targetType)

    const queryString = params.toString() ? `?${params.toString()}` : ''
    const res = await apiClient.get(`/admin/audit-logs${queryString}`)

    const payload = res.data?.data || res.data || {}
    const items =
      payload.logs ||
      payload.items ||
      res.data?.logs ||
      (Array.isArray(payload) ? payload : [])

    const logs = Array.isArray(items) ? [...items] : []
    logs.pagination = res.data?.pagination || payload.pagination || null
    return logs
  },
}
