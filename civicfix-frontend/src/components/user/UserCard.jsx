import { Avatar } from '../ui/Avatar.jsx'
import { Badge } from '../ui/Badge.jsx'
import { Button } from '../ui/Button.jsx'

function getRoleBadgeVariant(role) {
  switch (role) {
    case 'ADMIN':
      return 'danger'
    case 'AUTHORITY':
      return 'primary'
    case 'WORKER':
      return 'warning'
    case 'CITIZEN':
    default:
      return 'neutral'
  }
}

function getAvailabilityBadgeVariant(status) {
  switch (status) {
    case 'AVAILABLE':
    case 'ACTIVE':
      return 'success'
    case 'BUSY':
      return 'warning'
    case 'OFFLINE':
    case 'INACTIVE':
    default:
      return 'neutral'
  }
}

/**
 * UserCard Component
 * Profile and workload summary card for users, authorities, and field workers.
 */
export function UserCard({
  user,
  onView,
  onAssign,
  onToggleStatus,
  className = '',
}) {
  if (!user) return null

  const {
    name,
    email,
    phone,
    role = 'CITIZEN',
    status = 'ACTIVE',
    workload,
    department,
  } = user

  return (
    <article className={`cf-user-card ${className}`.trim()}>
      <div className="cf-user-card-top">
        <Avatar name={name} size="md" />
        <div>
          <div className="cf-user-card-name">{name}</div>
          <div className="cf-user-card-email">{email}</div>
        </div>
      </div>

      <div className="cf-inline-wrap">
        <Badge variant={getRoleBadgeVariant(role)}>{role}</Badge>
        <Badge variant={getAvailabilityBadgeVariant(status)}>{status}</Badge>
        {department && (
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-neutral-600)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            {department}
          </span>
        )}
      </div>

      <div className="cf-user-card-details">
        {phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', color: 'var(--color-neutral-700)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.07 3.37 2 2 0 0 1 3.08 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/></svg>
            {phone}
          </div>
        )}

        {workload && (
          <div className="cf-user-card-workload">
            <span>Active Tasks: <strong>{workload.active ?? 0}</strong></span>
            <span>Completed: <strong>{workload.completed ?? 0}</strong></span>
          </div>
        )}
      </div>

      <div className="cf-inline-wrap" style={{ marginTop: 'var(--space-2)' }}>
        {onAssign && status !== 'OFFLINE' && (
          <Button size="sm" onClick={() => onAssign(user)}>
            Assign Task
          </Button>
        )}
        {onView && (
          <Button size="sm" variant="secondary" onClick={() => onView(user)}>
            View Details
          </Button>
        )}
        {onToggleStatus && (
          <Button size="sm" variant="ghost" onClick={() => onToggleStatus(user)}>
            {status === 'ACTIVE' || status === 'AVAILABLE' ? 'Deactivate' : 'Activate'}
          </Button>
        )}
      </div>
    </article>
  )
}

