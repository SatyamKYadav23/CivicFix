import { formatRelativeTime } from '../../utils/formatters.js'
import { NOTIFICATION_TYPES } from '../../utils/constants.js'

function getNotificationIcon(type) {
  switch (type) {
    case NOTIFICATION_TYPES.WORKER_ASSIGNED:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case NOTIFICATION_TYPES.COMPLAINT_RESOLVED:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )
    case NOTIFICATION_TYPES.STATUS_UPDATED:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      )
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )
  }
}

/**
 * NotificationItem Component
 * Single notification entry with read/unread state and category icon.
 */
export function NotificationItem({
  notification,
  onClick,
  onToggleRead,
  className = '',
}) {
  if (!notification) return null

  const {
    id,
    title,
    message,
    type,
    read = false,
    createdAt,
    timestamp,
    targetId,
  } = notification

  const icon = getNotificationIcon(type)
  const isUnread = !read

  return (
    <article
      className={`cf-notification-item ${isUnread ? 'is-unread' : ''} ${className}`.trim()}
      onClick={() => onClick && onClick(notification)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick(notification)
              }
            }
          : undefined
      }
      aria-label={`${isUnread ? 'Unread notification: ' : 'Notification: '} ${title}`}
    >
      <div className="cf-notification-icon-wrap" aria-hidden="true">
        {icon}
      </div>

      <div className="cf-notification-body">
        <div className="cf-notification-title">{title}</div>
        <div className="cf-notification-message">{message}</div>
        <div className="cf-notification-time">
          {formatRelativeTime(createdAt || timestamp)}
          {targetId && ` • Ref: ${targetId}`}
        </div>
      </div>

      {onToggleRead && (
        <button
          type="button"
          className="link-button"
          style={{ fontSize: '0.75rem', alignSelf: 'center' }}
          onClick={(e) => {
            e.stopPropagation()
            onToggleRead(id, !read)
          }}
          aria-label={read ? 'Mark as unread' : 'Mark as read'}
        >
          {read ? 'Mark unread' : 'Mark read'}
        </button>
      )}
    </article>
  )
}

