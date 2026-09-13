import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useNotifications } from '../../hooks/useNotifications.js'
import { NotificationItem } from '../../components/notification/NotificationItem.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { ErrorState } from '../../components/ui/ErrorState.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'

export function CitizenNotifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { notifications, unreadCount, isLoading, error, refetch, markAsRead, markAllAsRead } =
    useNotifications(user?.id, 'CITIZEN')

  const [filterTab, setFilterTab] = useState('ALL') // 'ALL' | 'UNREAD'

  const filteredNotifications = useMemo(() => {
    if (filterTab === 'UNREAD') {
      return notifications.filter((n) => !n.read)
    }
    return notifications
  }, [notifications, filterTab])

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
          <h1 className="cf-page-title">Citizen Notifications</h1>
          <p className="cf-page-subtitle">Real-time alerts regarding your reported issues, worker dispatches, and resolutions.</p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="secondary" onClick={markAllAsRead}>
            ✓ Mark All as Read
          </Button>
        )}
      </div>

      <div style={{ maxWidth: '680px' }}>
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <button
            type="button"
            className={`btn ${filterTab === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.875rem', fontSize: '0.875rem' }}
            onClick={() => setFilterTab('ALL')}
          >
            All Alerts ({notifications.length})
          </button>
          <button
            type="button"
            className={`btn ${filterTab === 'UNREAD' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.875rem', fontSize: '0.875rem' }}
            onClick={() => setFilterTab('UNREAD')}
          >
            Unread Only ({unreadCount})
          </button>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
            <Spinner />
          </div>
        ) : filteredNotifications.length > 0 ? (
          <Card>
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              {filteredNotifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onSelect={(item) => {
                    markAsRead(item.id)
                    if (item.targetId) {
                      navigate(`/citizen/complaints/${item.targetId}`)
                    }
                  }}
                  onToggleRead={(id, newRead) => {
                    if (newRead) markAsRead(id)
                  }}
                />
              ))}
            </div>
          </Card>
        ) : (
          <EmptyState
            title={filterTab === 'UNREAD' ? 'No unread notifications' : 'No notifications'}
            description={
              filterTab === 'UNREAD'
                ? 'You are all caught up! There are no unread alerts.'
                : 'You have not received any notification alerts yet.'
            }
          />
        )}
      </div>
    </div>
  )
}
