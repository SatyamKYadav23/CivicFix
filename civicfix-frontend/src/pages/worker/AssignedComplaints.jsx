import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { workerService } from '../../services/workerService.js'
import { ComplaintStatus, ComplaintPriority } from '../../components/complaint/index.js'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { ErrorState } from '../../components/ui/ErrorState.jsx'
import { formatRelativeTime } from '../../utils/formatters.js'
import { COMPLAINT_STATUSES } from '../../utils/constants.js'

export function AssignedComplaints() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const loadTasks = useCallback(() => {
    setIsLoading(true)
    setError(null)
    workerService
      .getAssignedComplaints(user?.id, user?.email)
      .then((data) => {
        setTasks(data)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to retrieve assigned tasks.')
        setIsLoading(false)
      })
  }, [user])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Counts for filter pills
  const pendingAcceptanceCount = tasks.filter(
    (t) => t.status === COMPLAINT_STATUSES.ASSIGNED && t.taskStatus !== 'ACCEPTED'
  ).length
  const activeCount = tasks.filter(
    (t) =>
      (t.status === COMPLAINT_STATUSES.ASSIGNED && t.taskStatus === 'ACCEPTED') ||
      t.status === COMPLAINT_STATUSES.IN_PROGRESS
  ).length
  const completedCount = tasks.filter(
    (t) => t.status === COMPLAINT_STATUSES.RESOLVED || t.status === COMPLAINT_STATUSES.CLOSED
  ).length

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter === 'PENDING_ACCEPTANCE') {
        if (!(t.status === COMPLAINT_STATUSES.ASSIGNED && t.taskStatus !== 'ACCEPTED')) return false
      } else if (statusFilter === 'ACTIVE') {
        const isAccepted =
          t.status === COMPLAINT_STATUSES.ASSIGNED && t.taskStatus === 'ACCEPTED'
        const isInProgress = t.status === COMPLAINT_STATUSES.IN_PROGRESS
        if (!isAccepted && !isInProgress) return false
      } else if (statusFilter === 'COMPLETED') {
        if (t.status !== COMPLAINT_STATUSES.RESOLVED && t.status !== COMPLAINT_STATUSES.CLOSED)
          return false
      }

      if (search.trim()) {
        const q = search.toLowerCase()
        const loc =
          typeof t.location === 'object'
            ? (t.location.address || '').toLowerCase()
            : (t.location || '').toLowerCase()
        if (
          !t.title?.toLowerCase().includes(q) &&
          !t.id?.toLowerCase().includes(q) &&
          !loc.includes(q) &&
          !t.citizenName?.toLowerCase().includes(q)
        )
          return false
      }

      return true
    })
  }, [tasks, search, statusFilter])

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Tasks"
        description={error}
        onRetry={loadTasks}
      />
    )
  }

  return (
    <div className="cf-assigned-complaints-page">
      {/* ── Header ── */}
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">My Assigned Repair Tasks</h1>
          <p className="cf-page-subtitle">
            Complete history of civic repair orders dispatched to your terminal. Accept, start, and submit completion reports from here.
          </p>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="cf-complaints-control-box">
        <div className="cf-ccb-top-row">
          <div className="cf-search-input-wrap" style={{ flex: 1 }}>
            <span className="cf-siw-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input
              type="text"
              placeholder="Search by docket ID, location, or issue title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="cf-search-input"
            />
          </div>

          <div className="cf-dept-filter-pills">
            <button
              type="button"
              className={`cf-cat-pill ${statusFilter === 'ALL' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              All Tasks ({tasks.length})
            </button>
            <button
              type="button"
              className={`cf-cat-pill ${statusFilter === 'PENDING_ACCEPTANCE' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('PENDING_ACCEPTANCE')}
            >
              Pending Acceptance ({pendingAcceptanceCount})
            </button>
            <button
              type="button"
              className={`cf-cat-pill ${statusFilter === 'ACTIVE' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('ACTIVE')}
            >
              In Progress ({activeCount})
            </button>
            <button
              type="button"
              className={`cf-cat-pill ${statusFilter === 'COMPLETED' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('COMPLETED')}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>
      </div>

      {/* ── Task Cards ── */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner />
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="No Tasks Found"
          description={
            search
              ? 'No tasks match your search criteria. Try adjusting the search terms.'
              : 'No tasks in this view. New assignments will appear here when dispatched.'
          }
        />
      ) : (
        <div className="cf-master-complaints-cards-grid">
          {filteredTasks.map((task) => {
            const locationStr =
              typeof task.location === 'object'
                ? task.location.address || task.location.area
                : task.location

            const isPendingAcceptance =
              task.status === COMPLAINT_STATUSES.ASSIGNED && task.taskStatus !== 'ACCEPTED'
            const isAccepted =
              task.status === COMPLAINT_STATUSES.ASSIGNED && task.taskStatus === 'ACCEPTED'
            const isInProgress = task.status === COMPLAINT_STATUSES.IN_PROGRESS
            const isResolved =
              task.status === COMPLAINT_STATUSES.RESOLVED ||
              task.status === COMPLAINT_STATUSES.CLOSED

            const actionLabel = isPendingAcceptance
              ? 'Accept Task'
              : isAccepted
              ? 'Start Work'
              : isInProgress
              ? 'Submit Completion'
              : 'View Record'

            return (
              <div key={task.id} className="cf-master-complaint-card">
                <div className="cf-mcc-top">
                  <div className="cf-mcc-id-tag">{task.id}</div>
                  <span className="cf-mcc-date">{formatRelativeTime(task.createdAt)}</span>
                </div>

                <div className="cf-mcc-title-row">
                  <h3 className="cf-mcc-title">{task.title}</h3>
                  <span className="cf-mcc-cat-tag">{task.category || 'General'}</span>
                </div>

                <div className="cf-mcc-location">
                  {locationStr || 'Location on record'}
                </div>

                <div className="cf-mcc-meta-box">
                  <div className="cf-mcc-mb-item">
                    <span className="label">Reported By</span>
                    <span className="val">{task.citizenName || 'Citizen'}</span>
                  </div>
                  <div className="cf-mcc-mb-item">
                    <span className="label">Priority</span>
                    <span className="val">
                      <ComplaintPriority priority={task.priority} />
                    </span>
                  </div>
                </div>

                <div className="cf-mcc-footer">
                  <ComplaintStatus status={task.status} />
                  <Button
                    size="sm"
                    variant={isResolved ? 'secondary' : 'primary'}
                    onClick={() => navigate(`/worker/complaints/${task.id}`)}
                  >
                    {actionLabel}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
