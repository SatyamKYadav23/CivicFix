import { ComplaintStatus } from './ComplaintStatus.jsx'
import { ComplaintPriority } from './ComplaintPriority.jsx'
import { Button } from '../ui/Button.jsx'
import { formatDate, formatRelativeTime } from '../../utils/formatters.js'

/**
 * ComplaintTable Component
 * Data table optimized for Authority and Admin desktop complaint management workflows.
 */
export function ComplaintTable({
  complaints = [],
  role = 'AUTHORITY',
  onView,
  onAssign,
  emptyMessage = 'No complaints found.',
  className = '',
}) {
  return (
    <div className={`cf-table-wrap ${className}`.trim()}>
      <table className="cf-table">
        <thead>
          <tr>
            <th scope="col" style={{ width: '110px' }}>ID</th>
            <th scope="col">Complaint</th>
            <th scope="col">Category</th>
            <th scope="col">Location</th>
            <th scope="col">Priority</th>
            <th scope="col">Status</th>
            <th scope="col">Assigned To</th>
            <th scope="col">Date</th>
            <th scope="col" className="is-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {complaints.length > 0 ? (
            complaints.map((item) => {
              const locationStr = typeof item.location === 'object' ? item.location.address || item.location.area : item.location
              const workerName = item.assignedWorker?.name || (typeof item.assignedWorker === 'string' ? item.assignedWorker : null)

              return (
                <tr key={item.id}>
                  <td>
                    <span className="cf-complaint-card-id">{item.id}</span>
                  </td>
                  <td>
                    <strong>{item.title}</strong>
                  </td>
                  <td>{item.category || '—'}</td>
                  <td>{locationStr || '—'}</td>
                  <td>
                    <ComplaintPriority priority={item.priority} />
                  </td>
                  <td>
                    <ComplaintStatus status={item.status} />
                  </td>
                  <td>
                    {workerName ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        {workerName}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-neutral-500)' }}>Unassigned</span>
                    )}
                  </td>
                  <td title={item.createdAt ? formatDate(item.createdAt) : ''}>
                    {formatRelativeTime(item.updatedAt || item.createdAt)}
                  </td>
                  <td className="is-right">
                    <div className="cf-inline-wrap" style={{ justifyContent: 'flex-end' }}>
                      {role === 'AUTHORITY' && !workerName && onAssign && (
                        <Button size="sm" variant="secondary" onClick={() => onAssign(item)}>
                          Assign
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => (onView ? onView(item) : null)}>
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={9} className="cf-table-empty">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

