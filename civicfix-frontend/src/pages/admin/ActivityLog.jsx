import { useState, useEffect, useMemo } from 'react'
import { adminService } from '../../services/adminService.js'
import { Card } from '../../components/ui/Card.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { formatDateTime } from '../../utils/formatters.js'

export function ActivityLog() {
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  const fetchLogs = () => {
    setIsLoading(true)
    setError(null)
    adminService
      .getAuditLogs()
      .then((data) => {
        const logs = Array.isArray(data) ? data : (data?.logs || [])
        setActivities(logs)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load audit logs.')
        setIsLoading(false)
      })
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const actorName = act.actor?.name || act.actorName || 'System'
      const actorRole = act.actor?.role || act.actorRole || 'SYSTEM'
      const targetId = act.targetId || ''
      const action = act.action || ''

      if (search) {
        const q = search.toLowerCase()
        const matchActor = actorName.toLowerCase().includes(q)
        const matchTarget = targetId.toLowerCase().includes(q)
        const matchAction = action.toLowerCase().includes(q)
        if (!matchActor && !matchTarget && !matchAction) return false
      }
      if (roleFilter !== 'ALL' && actorRole !== roleFilter) return false
      return true
    })
  }, [activities, search, roleFilter])

  const handleResetFilters = () => {
    setSearch('')
    setRoleFilter('ALL')
  }

  return (
    <div>
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Master System Audit Log</h1>
          <p className="cf-page-subtitle">
            Immutable chronological record of all administrative actions, triage decisions, and technician updates.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
        <div style={{ minWidth: '240px', flex: 1 }}>
          <Input
            id="audit-search"
            label="Search Audit Events"
            placeholder="Search by actor name, complaint ID (e.g. CF-1001), or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ minWidth: '180px' }}>
          <Select
            id="audit-role-filter"
            label="Actor Role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Roles' },
              { value: 'CITIZEN', label: 'Citizen' },
              { value: 'AUTHORITY', label: 'Authority Officer' },
              { value: 'WORKER', label: 'Field Worker' },
              { value: 'ADMIN', label: 'Administrator' },
            ]}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <Button variant="secondary" onClick={handleResetFilters}>
            Reset
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner />
        </div>
      ) : error ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <p style={{ color: 'var(--color-danger-600)', marginBottom: 'var(--space-3)' }}>{error}</p>
            <Button variant="secondary" onClick={fetchLogs}>Retry</Button>
          </div>
        </Card>
      ) : (
        <Card>
          {filteredActivities.length > 0 ? (
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {filteredActivities.map((item) => {
                const role = item.actor?.role || item.actorRole || 'SYSTEM'
                const name = item.actor?.name || item.actorName || 'System'
                const time = item.createdAt || item.timestamp

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-3)',
                      backgroundColor: 'var(--color-neutral-50)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-neutral-200)',
                      flexWrap: 'wrap',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <Badge
                        variant={
                          role === 'ADMIN'
                            ? 'danger'
                            : role === 'AUTHORITY'
                            ? 'primary'
                            : role === 'WORKER'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {role}
                      </Badge>

                      <div>
                        <strong style={{ color: 'var(--color-neutral-900)' }}>{name}</strong>{' '}
                        <span style={{ color: 'var(--color-neutral-700)' }}>{item.action}</span>{' '}
                        {item.targetId && (
                          <span className="cf-complaint-card-id" style={{ display: 'inline-block', marginLeft: '4px' }}>
                            {item.targetId}
                          </span>
                        )}
                        {item.details && (
                          <span style={{ fontSize: '0.8125rem', color: 'var(--color-neutral-500)', marginLeft: '6px' }}>
                            ({item.details})
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
                      {formatDateTime(time)}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title="No audit events found"
              description="No system activity matches your search and role filters."
              action={
                <Button variant="secondary" onClick={handleResetFilters}>
                  Reset Search
                </Button>
              }
            />
          )}
        </Card>
      )}
    </div>
  )
}
