import { apiClient } from './apiClient.js'

function matchesDepartment(itemDept, targetDept) {
  if (!targetDept || targetDept === 'ALL') return true
  if (!itemDept) return true
  const a = itemDept.toLowerCase().trim()
  const b = targetDept.toLowerCase().trim()
  if (a === b || a.includes(b) || b.includes(a)) return true
  if (b.includes('road') && (a.includes('road') || a.includes('pothole'))) return true
  if (b.includes('light') && (a.includes('light') || a.includes('electric'))) return true
  if (b.includes('water') && (a.includes('water') || a.includes('leak') || a.includes('pipe'))) return true
  if (b.includes('sanitation') && (a.includes('sanitation') || a.includes('waste') || a.includes('garbage'))) return true
  if (b.includes('drainage') && (a.includes('drain') || a.includes('sewage'))) return true
  if (b.includes('park') && (a.includes('park') || a.includes('green'))) return true
  if (b.includes('transport') && (a.includes('transport') || a.includes('traffic'))) return true
  return false
}

export const workerService = {
  /**
   * Fetch workers, optionally filtered by department
   */
  async getWorkers(department = null) {
    let workers = []
    try {
      const res = await apiClient.get('/authority/workers')
      const payload = res.data?.data || res.data || {}
      const items = payload.workers || payload.items || (Array.isArray(payload) ? payload : [])
      workers = Array.isArray(items) ? [...items] : []
    } catch {
      const res = await apiClient.get('/users?role=WORKER')
      const payload = res.data?.data || res.data || {}
      const items = payload.users || payload.items || (Array.isArray(payload) ? payload : [])
      workers = Array.isArray(items) ? [...items] : []
    }

    if (department && department !== 'ALL') {
      workers = workers.filter((w) => matchesDepartment(w.department, department))
    }
    return workers
  },

  /**
   * Fetch worker details
   */
  async getWorkerById(id) {
    const res = await apiClient.get(`/users/${id}`)
    const payload = res.data?.data || res.data || {}
    return payload.user || payload
  },

  /**
   * Fetch tasks assigned to current worker
   */
  async getAssignedComplaints(filtersOrWorkerId = {}, workerEmail = null) {
    const params = new URLSearchParams()
    if (typeof filtersOrWorkerId === 'object' && filtersOrWorkerId !== null) {
      if (filtersOrWorkerId.page) params.append('page', filtersOrWorkerId.page)
      if (filtersOrWorkerId.limit) params.append('limit', filtersOrWorkerId.limit)
      if (filtersOrWorkerId.status && filtersOrWorkerId.status !== 'ALL') params.append('status', filtersOrWorkerId.status)
      if (filtersOrWorkerId.priority && filtersOrWorkerId.priority !== 'ALL') params.append('priority', filtersOrWorkerId.priority)
      if (filtersOrWorkerId.search) params.append('search', filtersOrWorkerId.search)
    }

    const queryString = params.toString() ? `?${params.toString()}` : ''
    const res = await apiClient.get(`/worker/complaints${queryString}`)

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
   * Task detail
   */
  async getTaskById(id) {
    const res = await apiClient.get(`/worker/complaints/${id}`)
    const payload = res.data?.data || res.data || {}
    return payload.complaint || payload
  },

  /**
   * Accept task assignment
   */
  async acceptTask(id, user = null) {
    const res = await apiClient.patch(`/worker/complaints/${id}/status`, {
      status: 'IN_PROGRESS',
      notes: `Task accepted by ${user?.name || 'technician'}`,
    })
    const payload = res.data?.data || res.data || {}
    return payload.complaint || payload
  },

  /**
   * Mark work started
   */
  async startWork(id, notes = 'Work initiated on site', user = null) {
    return this.acceptTask(id, user)
  },

  /**
   * Log checkpoint / materials used
   */
  async updateProgress(id, { notes, materialsUsed }) {
    const res = await apiClient.post(`/worker/complaints/${id}/update`, {
      notes: notes || 'Work progress recorded',
      materialsUsed: materialsUsed || '',
    })
    const payload = res.data?.data || res.data || {}
    return payload
  },

  /**
   * Complete task with optional resolution evidence
   */
  async completeTask(id, { resolutionNotes, notes, evidenceFile, materialsUsed }) {
    if (evidenceFile instanceof File || evidenceFile instanceof Blob) {
      const formData = new FormData()
      formData.append('evidence', evidenceFile)
      formData.append('notes', resolutionNotes || notes || 'Resolution evidence')
      try {
        await apiClient.post(`/worker/complaints/${id}/evidence`, formData)
      } catch (err) {
        console.warn('Evidence upload non-blocking warning:', err.message)
      }
    }

    const res = await apiClient.patch(`/worker/complaints/${id}/status`, {
      status: 'RESOLVED',
      notes: resolutionNotes || notes || 'Grievance resolved successfully on site',
    })
    const payload = res.data?.data || res.data || {}
    return payload.complaint || payload
  },

  /**
   * Toggle worker duty status
   */
  async toggleWorkerDuty(workerId, nextStatus) {
    try {
      const res = await apiClient.patch(`/admin/users/${workerId}/status`, {
        status: nextStatus === 'OFF_DUTY' ? 'INACTIVE' : 'ACTIVE',
        reason: `Duty status updated to ${nextStatus}`,
      })
      const payload = res.data?.data || res.data || {}
      return payload
    } catch {
      return { success: true, status: nextStatus }
    }
  },
}
