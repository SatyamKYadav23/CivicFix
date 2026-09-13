import { ComplaintStatus } from './ComplaintStatus.jsx'
import { ComplaintPriority } from './ComplaintPriority.jsx'
import { Button } from '../ui/Button.jsx'
import { formatRelativeTime } from '../../utils/formatters.js'

/**
 * ComplaintCard Component
 * Displays a responsive summary card for a civic complaint across all user roles.
 */
export function ComplaintCard({
  complaint,
  role = 'CITIZEN',
  onView,
  onAssign,
  onAction,
  actionLabel,
  className = '',
}) {
  if (!complaint) return null

  const {
    id,
    title,
    category,
    location,
    status,
    priority = 'MEDIUM',
    updatedAt,
    createdAt,
    assignedWorker,
  } = complaint

  const priorityLower = (priority || 'medium').toLowerCase()
  const highlightClass = priorityLower === 'critical' ? 'cf-complaint-card-critical' : priorityLower === 'high' ? 'cf-complaint-card-high' : ''
  const displayTime = formatRelativeTime(updatedAt || createdAt)

  return (
    <article className={`cf-complaint-card ${highlightClass} ${className}`.trim()}>
      <div className="cf-complaint-card-header">
        <div>
          <span className="cf-complaint-card-id">{id}</span>
          <h3 className="cf-complaint-card-title">{title}</h3>
        </div>
        <div className="cf-complaint-card-badges">
          <ComplaintPriority priority={priority} />
          <ComplaintStatus status={status} />
        </div>
      </div>

      <div className="cf-complaint-card-meta">
        {category && (
          <div className="cf-complaint-meta-item">
            <span className="cf-complaint-meta-icon" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            </span>
            <span>{category}</span>
          </div>
        )}
        {location && (
          <div className="cf-complaint-meta-item">
            <span className="cf-complaint-meta-icon" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </span>
            <span>{typeof location === 'object' ? location.address || location.area : location}</span>
          </div>
        )}
      </div>

      <footer className="cf-complaint-card-footer">
        <div className="cf-complaint-assigned-worker">
          {assignedWorker ? (
            <span>Assigned to <strong>{assignedWorker.name || assignedWorker}</strong></span>
          ) : (
            <span>Updated {displayTime}</span>
          )}
        </div>

        <div className="cf-complaint-card-actions">
          {role === 'AUTHORITY' && !assignedWorker && onAssign && (
            <Button size="sm" variant="secondary" onClick={() => onAssign(complaint)}>
              Assign
            </Button>
          )}

          {actionLabel && onAction ? (
            <Button size="sm" onClick={() => onAction(complaint)}>
              {actionLabel}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => (onView ? onView(complaint) : null)}
            >
              View Details
            </Button>
          )}
        </div>
      </footer>
    </article>
  )
}
