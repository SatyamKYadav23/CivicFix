import { apiClient } from './apiClient.js'
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storage.js'

export const authService = {
  /**
   * Log in user with credentials, store JWT, and return sanitized user profile
   */
  async login(email, password) {
    if (!email || !password) {
      throw new Error('Please enter both email and password.')
    }

    const res = await apiClient.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    })

    const payload = res.data?.data || res.data || res
    const user = payload.user || payload
    const token = payload.token || res.data?.token

    if (!user || !user.role) {
      throw new Error('Authentication failed: Invalid user profile returned.')
    }

    setStorageItem('cf_session', {
      user,
      token,
      loggedInAt: new Date().toISOString(),
    })

    return user
  },

  /**
   * Register a new citizen account and automatically authenticate session
   */
  async register(registrationData) {
    const { name, email, password, phone, address } = registrationData

    if (!name || !email || !password) {
      throw new Error('Please complete all required registration fields.')
    }

    const res = await apiClient.post('/auth/register', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone ? phone.trim() : null,
      address: address ? address.trim() : null,
    })

    const payload = res.data?.data || res.data || res
    const user = payload.user || payload
    const token = payload.token || res.data?.token

    if (!user || !user.role) {
      throw new Error('Registration failed: Invalid user profile returned.')
    }

    setStorageItem('cf_session', {
      user,
      token,
      loggedInAt: new Date().toISOString(),
    })

    return user
  },

  /**
   * Get cached user profile from active storage session
   */
  getCurrentUser() {
    const session = getStorageItem('cf_session', null)
    return session?.user || null
  },

  /**
   * Get token from active storage session
   */
  getToken() {
    const session = getStorageItem('cf_session', null)
    return session?.token || null
  },

  /**
   * Fetch latest profile directly from backend
   */
  async getProfile() {
    const res = await apiClient.get('/auth/me')
    const user = res.data?.data?.user || res.data?.data || res.data?.user || res.data

    const session = getStorageItem('cf_session', {})
    setStorageItem('cf_session', {
      ...session,
      user,
    })

    return user
  },

  /**
   * Update user profile information
   */
  async updateProfile(userId, updates) {
    const session = getStorageItem('cf_session', {})
    const updatedUser = { ...session.user, ...updates }
    setStorageItem('cf_session', { ...session, user: updatedUser })
    return updatedUser
  },

  /**
   * Log out session, invalidate backend token if applicable, and clear storage
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Ignore network errors on logout
    } finally {
      removeStorageItem('cf_session')
    }
  },
}
