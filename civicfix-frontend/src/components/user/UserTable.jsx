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

function getStatusBadgeVariant(status) {
  switch (status) {
    case 'ACTIVE':
    case 'AVAILABLE':
      return 'success'
    case 'BUSY':
      return 'warning'
    case 'INACTIVE':
    case 'OFFLINE':
    default:
      return 'neutral'
  }
}

/**
 * UserTable Component
 * Management table displaying users, authorities, and workers with administrative actions.
 */
export function UserTable({
  users = [],
  onView,
  onToggleStatus,
  emptyMessage = 'No users found.',
  className = '',
}) {
  return (
    <div className={`cf-table-wrap ${className}`.trim()}>
      <table className="cf-table">
        <thead>
          <tr>
            <th scope="col">User</th>
            <th scope="col">Email</th>
            <th scope="col">Role</th>
            <th scope="col">Status</th>
            <th scope="col">Workload</th>
            <th scope="col" className="is-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((u) => {
              const activeCount = u.workload?.active ?? u.activeTasks ?? 0

              return (
                <tr key={u.id || u.email}>
                  <td>
                    <div className="cf-inline-wrap" style={{ gap: 'var(--space-3)' }}>
                      <Avatar name={u.name} size="sm" />
                      <div>
                        <strong>{u.name}</strong>
                        {u.phone && <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>{u.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <Badge variant={getRoleBadgeVariant(u.role)}>{u.role}</Badge>
                  </td>
                  <td>
                    <Badge variant={getStatusBadgeVariant(u.status)}>{u.status}</Badge>
                  </td>
                  <td>
                    {u.role === 'WORKER' ? (
                      <span>{activeCount} active task{activeCount === 1 ? '' : 's'}</span>
                    ) : (
                      <span style={{ color: 'var(--color-neutral-400)' }}>—</span>
                    )}
                  </td>
                  <td className="is-right">
                    <div className="cf-inline-wrap" style={{ justifyContent: 'flex-end' }}>
                      {onView && (
                        <Button size="sm" variant="ghost" onClick={() => onView(u)}>
                          View
                        </Button>
                      )}
                      {onToggleStatus && (
                        <Button
                          size="sm"
                          variant={u.status === 'ACTIVE' || u.status === 'AVAILABLE' ? 'destructive' : 'secondary'}
                          onClick={() => onToggleStatus(u)}
                        >
                          {u.status === 'ACTIVE' || u.status === 'AVAILABLE' ? 'Deactivate' : 'Activate'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={6} className="cf-table-empty">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

