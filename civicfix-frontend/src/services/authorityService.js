import { apiClient } from './apiClient.js'

export const authorityService = {
  /**
   * List complaints within authority department jurisdiction
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
    const res = await apiClient.get(`/authority/complaints${queryString}`)

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
   * Get detailed complaint by ID including audit timeline
   */
  async getComplaintById(id) {
    const res = await apiClient.get(`/authority/complaints/${id}`)
    const payload = res.data?.data || res.data || {}
    return payload.complaint || payload
  },

  /**
   * Update complaint status and log audit event
   */
  async updateStatus(id, { status, notes }) {
    const res = await apiClient.patch(`/authority/complaints/${id}/status`, {
      status,
      notes: notes || `Status updated to ${status}`,
    })
    const payload = res.data?.data || res.data || {}
    return payload.complaint || payload
  },

  /**
   * Adjust or escalate complaint priority
   */
  async updatePriority(id, { priority, notes }) {
    const res = await apiClient.patch(`/authority/complaints/${id}/priority`, {
      priority,
      notes: notes || `Priority escalated to ${priority}`,
    })
    const payload = res.data?.data || res.data || {}
    return payload.complaint || payload
  },

  /**
   * Assign a field worker/technician to a complaint
   */
  async assignWorker(id, { workerId, instructions, notes }) {
    const res = await apiClient.post(`/authority/complaints/${id}/assign`, {
      workerId,
      instructions: instructions || notes || 'Assigned to technician for resolution',
      notes: notes || instructions,
    })
    const payload = res.data?.data || res.data || {}
    return payload.complaint || payload
  },

  /**
   * Retrieve active field workers available for dispatch
   */
  async getWorkers() {
    const res = await apiClient.get('/authority/workers')
    const payload = res.data?.data || res.data || {}
    const items =
      payload.workers ||
      payload.items ||
      res.data?.workers ||
      (Array.isArray(payload) ? payload : [])
    return Array.isArray(items) ? items : []
  },

  /**
   * Register a new field technician under this authority's department
   */
  async createWorker(workerData) {
    const res = await apiClient.post('/authority/workers', {
      name: workerData.name,
      email: workerData.email,
      password: workerData.password || 'Worker123!',
      phone: workerData.phone || '',
      department: workerData.department,
      skills: workerData.skills || workerData.specialty || '',
    })
    const payload = res.data?.data || res.data || {}
    return payload.worker || payload.user || payload
  },

  /**
   * Retrieve operational metrics and dashboard analytics for department
   */
  async getAnalytics() {
    const res = await apiClient.get('/authority/analytics')
    return res.data?.data || res.data || {}
  },
}
