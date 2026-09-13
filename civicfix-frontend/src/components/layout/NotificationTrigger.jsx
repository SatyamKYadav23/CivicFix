import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { notificationService } from '../../services/notificationService.js'
import { NotificationPanel } from '../notification/NotificationPanel.jsx'

/**
 * NotificationTrigger Component
 * Topbar notification trigger button with unread counter and interactive dropdown panel.
 * Connects directly to genuine user notifications from the backend API.
 */
export function NotificationTrigger({
  notifications: propNotifications,
  onSelectNotification,
  className = '',
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const triggerRef = useRef(null)

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifs([])
      return
    }
    try {
      const data = await notificationService.getNotifications()
      setNotifs(Array.isArray(data) ? data : [])
    } catch {
      setNotifs([])
    }
  }, [user])

  useEffect(() => {
    if (propNotifications && Array.isArray(propNotifications)) {
      setNotifs(propNotifications)
    } else {
      loadNotifications()
    }
  }, [propNotifications, loadNotifications])

  // Refresh notifications whenever the dropdown opens
  useEffect(() => {
    if (open && !propNotifications) {
      loadNotifications()
    }
  }, [open, propNotifications, loadNotifications])

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const calculatedUnread = notifs.filter((n) => !n.read && !n.isRead).length

  const handleToggleRead = async (id, newRead) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: newRead, isRead: newRead } : n))
    )
    if (newRead) {
      try {
        await notificationService.markAsRead(id)
      } catch (err) {
        console.error('Failed to mark notification as read:', err)
      }
    }
  }

  const handleMarkAllRead = async () => {
    setNotifs((prev) =>
      prev.map((n) => ({ ...n, read: true, isRead: true }))
    )
    try {
      await notificationService.markAllAsRead()
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const handleSelect = async (item) => {
    setOpen(false)
    if (!item.read && !item.isRead) {
      handleToggleRead(item.id, true)
    }

    if (onSelectNotification) {
      onSelectNotification(item)
      return
    }

    const target = item.complaintId || item.targetId
    const role = user?.role?.toUpperCase() || 'CITIZEN'

    if (target) {
      if (role === 'CITIZEN') navigate(`/citizen/complaints/${target}`)
      else if (role === 'AUTHORITY') navigate(`/authority/complaints/${target}`)
      else if (role === 'WORKER') navigate(`/worker/complaints/${target}`)
      else if (role === 'ADMIN') navigate(`/admin/complaints`)
    }
  }

  return (
    <div className={`cf-notif-trigger-wrap ${className}`.trim()} ref={triggerRef}>
      <button
        type="button"
        className="cf-notif-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={`Notifications (${calculatedUnread} unread)`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {calculatedUnread > 0 && (
          <span className="cf-notif-badge-pill">{calculatedUnread}</span>
        )}
      </button>

      {open && (
        <div className="cf-notif-popover">
          <NotificationPanel
            notifications={notifs}
            onSelectNotification={handleSelect}
            onMarkAllRead={handleMarkAllRead}
            onToggleRead={handleToggleRead}
            emptyMessage="No notifications yet."
          />
        </div>
      )}
    </div>
  )
}

