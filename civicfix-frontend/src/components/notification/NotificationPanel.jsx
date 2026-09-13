import { useState } from 'react'
import { NotificationItem } from './NotificationItem.jsx'
import { Badge } from '../ui/Badge.jsx'
import { Button } from '../ui/Button.jsx'

/**
 * NotificationPanel Component
 * Interactive notification container showing filtered alerts and status actions.
 */
export function NotificationPanel({
  notifications = [],
  onSelectNotification,
  onMarkAllRead,
  onToggleRead,
  emptyMessage = 'No notifications yet.',
  className = '',
}) {
  const [filter, setFilter] = useState('ALL') // 'ALL' | 'UNREAD'

  const unreadCount = notifications.filter((n) => !n.read).length

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'UNREAD') return !item.read
    return true
  })

  return (
    <section className={`cf-notification-panel ${className}`.trim()} aria-label="Notifications panel">
      <header className="cf-notification-panel-header">
        <h3>
          Notifications
          {unreadCount > 0 && <Badge variant="primary">{unreadCount}</Badge>}
        </h3>

        {unreadCount > 0 && onMarkAllRead && (
          <Button size="sm" variant="ghost" onClick={onMarkAllRead}>
            Mark all read
          </Button>
        )}
      </header>

      <div className="cf-tabs-nav" style={{ padding: '0 var(--space-4)', borderBottom: '1px solid var(--color-neutral-200)' }}>
        <button
          type="button"
          className={`cf-tab ${filter === 'ALL' ? 'is-active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          className={`cf-tab ${filter === 'UNREAD' ? 'is-active' : ''}`}
          onClick={() => setFilter('UNREAD')}
        >
          Unread ({unreadCount})
        </button>
      </div>

      <div className="cf-notification-list">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onClick={onSelectNotification}
              onToggleRead={onToggleRead}
            />
          ))
        ) : (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-neutral-500)' }}>
            {emptyMessage}
          </div>
        )}
      </div>
    </section>
  )
}

