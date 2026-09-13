import { useState, useEffect, useCallback } from 'react'
import { notificationService } from '../services/notificationService.js'

export function useNotifications(userId = null, role = null) {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await notificationService.getNotifications(userId, role)
      setNotifications(data)
    } catch (err) {
      setError(err.message || 'Failed to load notifications.')
    } finally {
      setIsLoading(false)
    }
  }, [userId, role])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    } catch (err) {
      console.error('Failed to mark notification as read', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(userId, role)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (err) {
      console.error('Failed to mark all as read', err)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}
