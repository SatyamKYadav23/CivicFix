import { Avatar } from '../ui/Avatar.jsx'
import { formatRelativeTime } from '../../utils/formatters.js'

/**
 * ActivityFeed Component
 * Displays system-wide or team activity events in chronological order.
 */
export function ActivityFeed({
  activities = [],
  title = 'Recent Activity',
  emptyMessage = 'No recent activity recorded.',
  onSelectEntity,
  className = '',
}) {
  return (
    <div className={`cf-activity-widget ${className}`.trim()}>
      <h3 className="cf-activity-widget-title">{title}</h3>

      <div className="cf-activity-list" role="feed" aria-label={title}>
        {activities.length > 0 ? (
          activities.map((item, index) => (
            <div key={item.id || index} className="cf-activity-item">
              <div className="cf-activity-avatar">
                <Avatar name={item.actor?.name || item.actorName || 'System'} size="sm" />
              </div>

              <div className="cf-activity-content">
                <div className="cf-activity-text">
                  <strong>{item.actor?.name || item.actorName || 'System'}</strong>{' '}
                  {item.action || 'updated'}{' '}
                  {item.targetId ? (
                    <span
                      className="cf-activity-target"
                      style={{ cursor: onSelectEntity ? 'pointer' : 'inherit' }}
                      onClick={() => onSelectEntity && onSelectEntity(item.targetId, item)}
                    >
                      {item.targetId}
                    </span>
                  ) : null}
                  {item.details ? ` — ${item.details}` : ''}
                </div>

                <div className="cf-activity-time">
                  {formatRelativeTime(item.timestamp || item.createdAt)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--color-neutral-500)', padding: 'var(--space-4)' }}>
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  )
}

