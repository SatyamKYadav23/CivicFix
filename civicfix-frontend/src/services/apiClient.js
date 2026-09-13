import axios from 'axios'
import { getStorageItem, removeStorageItem } from '../utils/storage.js'

const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}
const API_BASE_URL =
  metaEnv.VITE_API_URL ||
  metaEnv.VITE_API_BASE_URL ||
  (typeof process !== 'undefined' && process?.env?.VITE_API_URL) ||
  'http://localhost:5000/api'

// Create Axios client instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

// Request Interceptor: Attach JWT Bearer token
axiosInstance.interceptors.request.use(
  (config) => {
    const session = getStorageItem('cf_session', null)
    const token = session?.token || null

    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }

    // If sending FormData, let browser set Content-Type with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json'
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Unified error extraction and 401 session handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      if (
        !currentPath.includes('/login') &&
        !currentPath.includes('/register') &&
        currentPath !== '/'
      ) {
        removeStorageItem('cf_session')
      }
    }
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected network error occurred.'
    return Promise.reject(new Error(message))
  }
)

export const apiClient = {
  instance: axiosInstance,
  get: (url, config) => axiosInstance.get(url, config),
  post: (url, data, config) => axiosInstance.post(url, data, config),
  put: (url, data, config) => axiosInstance.put(url, data, config),
  patch: (url, data, config) => axiosInstance.patch(url, data, config),
  delete: (url, config) => axiosInstance.delete(url, config),
  request: (endpoint, options = {}) => {
    return axiosInstance({
      url: endpoint,
      method: options.method || 'GET',
      data: options.body || options.data,
      headers: options.headers,
      params: options.params,
    })
  },
}

export default apiClient
