import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useNotifications } from '../../hooks/useNotifications.js'
import { NotificationPanel } from '../../components/notification/NotificationPanel.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { ErrorState } from '../../components/ui/ErrorState.jsx'

export function AuthorityNotifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { notifications, unreadCount, isLoading, error, refetch, markAsRead, markAllAsRead } =
    useNotifications(user?.id, 'AUTHORITY')

  const handleSelectNotification = (n) => {
    markAsRead(n.id)
    const target = n.complaintId || n.targetId
    if (target) navigate(`/authority/complaints/${target}`)
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load notifications"
        description={error}
        onRetry={refetch}
      />
    )
  }

  return (
    <div>
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Officer Notifications</h1>
          <p className="cf-page-subtitle">Incoming reports, worker updates, and resolution alerts for your municipal division.</p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="secondary" onClick={markAllAsRead}>
            ✓ Mark All as Read
          </Button>
        )}
      </div>

      <div style={{ maxWidth: '680px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
            <Spinner />
          </div>
        ) : (
          <NotificationPanel
            notifications={notifications}
            onSelectNotification={handleSelectNotification}
            onMarkAllRead={markAllAsRead}
            onToggleRead={(id) => markAsRead(id)}
            emptyMessage="You're all caught up! No notifications for your department."
          />
        )}
      </div>
    </div>
  )
}

