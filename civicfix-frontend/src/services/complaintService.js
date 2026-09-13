import { apiClient } from './apiClient.js'
import { notificationService } from './notificationService.js'

export function normalizeCategoryToBackend(cat) {
  if (!cat || cat === 'ALL') return null
  const upper = String(cat).toUpperCase().trim()
  const backendEnums = [
    'ROADS_POTHOLES',
    'STREET_LIGHTS',
    'WATER_SUPPLY',
    'SANITATION_WASTE',
    'DRAINAGE_SEWAGE',
    'PARKS_PUBLIC_SPACES',
    'PUBLIC_TRANSPORT',
    'OTHER',
  ]
  if (backendEnums.includes(upper)) return upper
  const lower = String(cat).toLowerCase()
  if (lower.includes('road') || lower.includes('pothole')) return 'ROADS_POTHOLES'
  if (lower.includes('light') || lower.includes('street')) return 'STREET_LIGHTS'
  if (lower.includes('water') || lower.includes('leak') || lower.includes('pipe')) return 'WATER_SUPPLY'
  if (lower.includes('sanitat') || lower.includes('waste') || lower.includes('garbage')) return 'SANITATION_WASTE'
  if (lower.includes('drain') || lower.includes('sewage')) return 'DRAINAGE_SEWAGE'
  if (lower.includes('park') || lower.includes('garden') || lower.includes('public space')) return 'PARKS_PUBLIC_SPACES'
  if (lower.includes('transport') || lower.includes('traffic') || lower.includes('transit')) return 'PUBLIC_TRANSPORT'
  return 'OTHER'
}

export const complaintService = {
  /**
   * Retrieve list of complaints with search, filtering, and pagination
   */
  async getComplaints(filters = {}) {
    const params = new URLSearchParams()

    if (filters.page) params.append('page', filters.page)
    if (filters.limit) params.append('limit', filters.limit)
    if (filters.search) params.append('search', filters.search)
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status)
    if (filters.category && filters.category !== 'ALL') {
      const backendCat = normalizeCategoryToBackend(filters.category)
      params.append('category', backendCat || filters.category)
    }
    if (filters.priority && filters.priority !== 'ALL') params.append('priority', filters.priority)
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
    if (filters.assignedWorkerId) params.append('assignedWorkerId', filters.assignedWorkerId)
    if (filters.location) params.append('location', filters.location)

    const queryString = params.toString() ? `?${params.toString()}` : ''
    const res = await apiClient.get(`/complaints${queryString}`)

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
   * Alias for getComplaints for compatibility
   */
  async getAllComplaints(filters = {}) {
    return this.getComplaints(filters)
  },

  /**
   * Fetch single complaint by ID
   */
  async getComplaintById(id) {
    const res = await apiClient.get(`/complaints/${id}`)
    const payload = res.data?.data || res.data || {}
    return payload.complaint || payload
  },

  /**
   * Create a new complaint (supports multipart upload)
   */
  async createComplaint(complaintData, currentUser = null) {
    if (!complaintData.title || !complaintData.category || !complaintData.location) {
      throw new Error('Please complete title, category, and location.')
    }

    const backendCategory = normalizeCategoryToBackend(complaintData.category) || 'OTHER'
    const rawFile = complaintData.image || complaintData.file || null

    let payload
    if (rawFile instanceof File || rawFile instanceof Blob) {
      payload = new FormData()
      payload.append('title', complaintData.title.trim())
      payload.append('description', (complaintData.description || '').trim())
      payload.append('category', backendCategory)
      payload.append('location', complaintData.location)
      if (complaintData.priority) payload.append('priority', complaintData.priority)
      if (complaintData.landmark) payload.append('landmark', complaintData.landmark)
      if (complaintData.coordinates?.lat) payload.append('latitude', complaintData.coordinates.lat)
      if (complaintData.coordinates?.lng) payload.append('longitude', complaintData.coordinates.lng)
      payload.append('evidence', rawFile)
    } else {
      payload = {
        title: complaintData.title.trim(),
        description: (complaintData.description || '').trim(),
        category: backendCategory,
        location: complaintData.location,
        priority: complaintData.priority || 'MEDIUM',
        landmark: complaintData.landmark || '',
        latitude: complaintData.coordinates?.lat || null,
        longitude: complaintData.coordinates?.lng || null,
        photos: complaintData.photos || complaintData.evidence || [],
      }
    }

    const res = await apiClient.post('/complaints', payload)
    const resPayload = res.data?.data || res.data || {}
    const newComplaint = resPayload.complaint || resPayload

    // Best-effort notification dispatch
    try {
      await notificationService.notifyComplaintCreated(newComplaint, currentUser)
    } catch (e) {
      console.warn('Notification non-blocking warning:', e.message)
    }

    return newComplaint
  },

  /**
   * Update complaint fields
   */
  async updateComplaint(id, updateData) {
    const res = await apiClient.put(`/complaints/${id}`, updateData)
    const payload = res.data?.data || res.data || {}
    return payload.complaint || payload
  },

  /**
   * Update complaint status
   */
  async updateComplaintStatus(id, newStatus, notes = '', currentUser = null) {
    try {
      const res = await apiClient.patch(`/authority/complaints/${id}/status`, {
        status: newStatus,
        notes: notes || `Status updated to ${newStatus}`,
      })
      const payload = res.data?.data || res.data || {}
      return payload.complaint || payload
    } catch {
      const res = await apiClient.put(`/complaints/${id}`, {
        status: newStatus,
        notes: notes || `Status updated to ${newStatus}`,
      })
      const payload = res.data?.data || res.data || {}
      return payload.complaint || payload
    }
  },

  /**
   * Assign worker to complaint
   */
  async assignWorker(complaintId, workerId, notes = '') {
    const res = await apiClient.post(`/authority/complaints/${complaintId}/assign`, {
      workerId,
      notes: notes || 'Assigned to field technician for resolution',
    })
    const payload = res.data?.data || res.data || {}
    return payload.complaint || payload
  },

  /**
   * Cancel or withdraw complaint
   */
  async cancelComplaint(complaintId, reason = 'Cancelled by citizen', citizenUser = null) {
    const res = await apiClient.delete(`/complaints/${complaintId}`)
    const payload = res.data?.data || res.data || {}
    return payload.complaint || payload
  },

  /**
   * Delete complaint
   */
  async deleteComplaint(complaintId) {
    return this.cancelComplaint(complaintId)
  },

  /**
   * Submit citizen satisfaction feedback
   */
  async submitFeedback(complaintId, rating, comment = '', citizenName = 'Citizen') {
    const res = await apiClient.post(`/complaints/${complaintId}/feedback`, {
      rating: Number(rating),
      comments: comment,
      citizenName,
    })
    const payload = res.data?.data || res.data || {}
    return payload.feedback || payload
  },

  /**
   * Audit timeline history
   */
  async getComplaintTimeline(id) {
    try {
      const res = await apiClient.get(`/complaints/${id}/history`)
      const payload = res.data?.data || res.data || {}
      const list = payload.timeline || payload.history || (Array.isArray(payload) ? payload : [])
      return Array.isArray(list) ? list : []
    } catch {
      const res = await apiClient.get(`/complaints/${id}/timeline`)
      const payload = res.data?.data || res.data || {}
      const list = payload.timeline || payload.history || (Array.isArray(payload) ? payload : [])
      return Array.isArray(list) ? list : []
    }
  },

  /**
   * Add progress update checkpoint
   */
  async addComplaintUpdate(id, updateData) {
    const res = await apiClient.post(`/worker/complaints/${id}/update`, updateData)
    const payload = res.data?.data || res.data || {}
    return payload
  },
}
