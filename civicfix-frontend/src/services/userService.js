import { apiClient } from './apiClient.js'

export const userService = {
  /**
   * Fetch users with optional role or filter params
   */
  async getUsers(roleOrFilters = null) {
    const params = new URLSearchParams()
    if (typeof roleOrFilters === 'string') {
      if (roleOrFilters && roleOrFilters !== 'ALL') {
        params.append('role', roleOrFilters)
      }
    } else if (roleOrFilters && typeof roleOrFilters === 'object') {
      if (roleOrFilters.role && roleOrFilters.role !== 'ALL') params.append('role', roleOrFilters.role)
      if (roleOrFilters.status && roleOrFilters.status !== 'ALL') params.append('status', roleOrFilters.status)
      if (roleOrFilters.search) params.append('search', roleOrFilters.search)
      if (roleOrFilters.page) params.append('page', roleOrFilters.page)
      if (roleOrFilters.limit) params.append('limit', roleOrFilters.limit)
    }

    const queryString = params.toString() ? `?${params.toString()}` : ''
    try {
      const res = await apiClient.get(`/users${queryString}`)
      const payload = res.data?.data || res.data || {}
      const items =
        payload.users ||
        payload.items ||
        res.data?.users ||
        (Array.isArray(payload) ? payload : [])
      const users = Array.isArray(items) ? [...items] : []
      users.pagination = res.data?.pagination || payload.pagination || null
      return users
    } catch {
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
    }
  },

  /**
   * Fetch user by ID
   */
  async getUserById(id) {
    const res = await apiClient.get(`/users/${id}`)
    const payload = res.data?.data || res.data || {}
    return payload.user || payload
  },

  /**
   * Role-specific helpers
   */
  async getAuthorities() {
    return this.getUsers('AUTHORITY')
  },

  async getWorkers() {
    return this.getUsers('WORKER')
  },

  async getCitizens() {
    return this.getUsers('CITIZEN')
  },

  /**
   * Create Authority Officer
   */
  async createAuthority(authorityData, adminUser = null) {
    const res = await apiClient.post('/admin/users', {
      name: authorityData.name,
      email: authorityData.email,
      password: authorityData.password || 'Authority123!',
      role: 'AUTHORITY',
      department: authorityData.department || 'MUNICIPAL',
      zone: authorityData.zone || '',
      designation: authorityData.designation || '',
      phone: authorityData.phone || '',
    })
    const payload = res.data?.data || res.data || {}
    return payload.user || payload
  },

  /**
   * Create Field Worker (Admin or Authority)
   */
  async createWorker(workerData, currentUser = null) {
    let isAuthority = currentUser?.role === 'AUTHORITY'
    if (!isAuthority && typeof window !== 'undefined') {
      try {
        const session = JSON.parse(localStorage.getItem('cf_session') || '{}')
        isAuthority = session?.user?.role === 'AUTHORITY'
      } catch {
        isAuthority = false
      }
    }

    const endpoint = isAuthority ? '/authority/workers' : '/admin/users'

    const res = await apiClient.post(endpoint, {
      name: workerData.name,
      email: workerData.email,
      password: workerData.password || 'Worker123!',
      role: 'WORKER',
      department: workerData.department || currentUser?.department || 'Field Operations',
      skills: workerData.skills || workerData.specialty || '',
      phone: workerData.phone || '',
    })
    const payload = res.data?.data || res.data || {}
    return payload.worker || payload.user || payload
  },

  /**
   * Toggle user active/inactive status
   */
  async toggleUserStatus(id, adminUser = null) {
    let current = null
    try {
      current = await this.getUserById(id)
    } catch {
      current = null
    }

    const currentStatus = current?.status || 'ACTIVE'
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

    return this.updateUserStatus(id, {
      status: nextStatus,
      reason: `Status toggled to ${nextStatus} by ${adminUser?.name || 'Administrator'}`,
    })
  },

  /**
   * Update user status directly
   */
  async updateUserStatus(id, { status, reason }) {
    const res = await apiClient.patch(`/admin/users/${id}/status`, {
      status,
      reason: reason || `Account status changed to ${status}`,
    })
    const payload = res.data?.data || res.data || {}
    return payload.user || payload
  },

  /**
   * Delete or deactivate user
   */
  async deleteUser(id, adminUser = null) {
    return this.updateUserStatus(id, {
      status: 'INACTIVE',
      reason: `Deactivated by ${adminUser?.name || 'Administrator'}`,
    })
  },

  /**
   * Update user profile
   */
  async updateUser(id, updateData) {
    try {
      const res = await apiClient.put(`/users/${id}`, updateData)
      const payload = res.data?.data || res.data || {}
      return payload.user || payload
    } catch {
      const res = await apiClient.patch(`/admin/users/${id}`, updateData)
      const payload = res.data?.data || res.data || {}
      return payload.user || payload
    }
  },
}
