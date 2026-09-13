import { ComplaintStatus } from '../complaint/ComplaintStatus.jsx'
import { ComplaintPriority } from '../complaint/ComplaintPriority.jsx'
import { formatRelativeTime } from '../../utils/formatters.js'
import { Button } from '../ui/Button.jsx'

/**
 * RecentComplaints Component
 * Compact summary widget displaying recently active complaints on role dashboards.
 */
export function RecentComplaints({
  complaints = [],
  title = 'Recent Complaints',
  onViewAll,
  onSelectComplaint,
  emptyMessage = 'No recent complaints found.',
  className = '',
}) {
  return (
    <div className={`cf-recent-widget ${className}`.trim()}>
      <div className="cf-recent-header">
        <h3>{title}</h3>
        {onViewAll && (
          <Button size="sm" variant="ghost" onClick={onViewAll}>
            View all
          </Button>
        )}
      </div>

      <div className="cf-recent-list">
        {complaints.length > 0 ? (
          complaints.map((item) => {
            const locationStr =
              typeof item.location === 'object' ? item.location.address || item.location.area : item.location

            return (
              <div
                key={item.id}
                className="cf-recent-item"
                onClick={() => onSelectComplaint && onSelectComplaint(item)}
                role={onSelectComplaint ? 'button' : undefined}
                tabIndex={onSelectComplaint ? 0 : undefined}
                onKeyDown={
                  onSelectComplaint
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onSelectComplaint(item)
                        }
                      }
                    : undefined
                }
              >
                <div className="cf-recent-item-info">
                  <div className="cf-recent-item-title">
                    <span className="cf-complaint-card-id" style={{ marginRight: '8px' }}>
                      {item.id}
                    </span>
                    {item.title}
                  </div>
                  <div className="cf-recent-item-meta">
                    {locationStr && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {locationStr}
                      </span>
                    )}
                    <span>•</span>
                    <span>{formatRelativeTime(item.updatedAt || item.createdAt)}</span>
                  </div>
                </div>

                <div className="cf-inline-wrap">
                  <ComplaintPriority priority={item.priority} />
                  <ComplaintStatus status={item.status} />
                </div>
              </div>
            )
          })
        ) : (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-neutral-500)' }}>
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  )
}

