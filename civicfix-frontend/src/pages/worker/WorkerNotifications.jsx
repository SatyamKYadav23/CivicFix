import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { notificationService } from '../../services/notificationService.js'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { formatRelativeTime } from '../../utils/formatters.js'

export function WorkerNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const loadNotifications = () => {
    setIsLoading(true)
    notificationService
      .getNotifications(user?.id)
      .then((data) => {
        setNotifications(data)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }

  useEffect(() => {
    loadNotifications()
  }, [user])

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(user?.id)
    loadNotifications()
  }

  return (
    <div className="cf-worker-notifications-page">
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Field Dispatch Notifications</h1>
          <p className="cf-page-subtitle">
            Real-time updates regarding task assignments, emergency priority alerts, and citizen ratings.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <Button variant="secondary" onClick={handleMarkAllRead}>
            Mark All Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No Notifications"
          description="You're all caught up! New repair orders and alerts will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="cf-notification-item"
              style={{
                background: n.isRead ? 'var(--color-white)' : '#f0f9ff',
                border: n.isRead ? '1px solid var(--color-neutral-200)' : '1px solid #bae6fd',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-3)',
              }}
            >
              <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                {n.type === 'ASSIGNMENT' ? '🔧' : n.type === 'ALERT' ? '⚠️' : '🔔'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: 'var(--color-neutral-950)' }}>{n.title}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-400)' }}>
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', color: 'var(--color-neutral-700)', fontSize: '0.875rem' }}>
                  {n.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
