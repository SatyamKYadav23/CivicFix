import { apiClient } from './apiClient.js'

export const analyticsService = {
  /**
   * Metrics for Citizen Dashboard
   */
  async getCitizenStats() {
    const res = await apiClient.get('/analytics/citizen')
    return res.data?.data || res.data || {}
  },

  /**
   * Operational Metrics for Authority Dashboard
   */
  async getAuthorityStats() {
    const res = await apiClient.get('/analytics/authority')
    return res.data?.data || res.data || {}
  },

  /**
   * Workload & Task Metrics for Worker Dashboard
   */
  async getWorkerStats() {
    const res = await apiClient.get('/analytics/worker')
    return res.data?.data || res.data || {}
  },

  /**
   * System-Wide Metrics for Admin Dashboard
   */
  async getAdminStats() {
    const res = await apiClient.get('/analytics/admin')
    return res.data?.data || res.data || {}
  },
}
