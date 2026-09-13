import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { workerService } from '../../services/workerService.js'
import { ComplaintStatus, ComplaintPriority } from '../../components/complaint/index.js'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { formatRelativeTime } from '../../utils/formatters.js'
import { COMPLAINT_STATUSES } from '../../utils/constants.js'

export function WorkerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [dutyStatus, setDutyStatus] = useState(user?.status || 'AVAILABLE')
  const [isTogglingDuty, setIsTogglingDuty] = useState(false)

  const loadTasks = useCallback(() => {
    setIsLoading(true)
    workerService
      .getAssignedComplaints(user?.id, user?.email)
      .then((data) => {
        setTasks(data)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setIsLoading(false)
      })
  }, [user])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const handleToggleDuty = async () => {
    setIsTogglingDuty(true)
    const next = dutyStatus === 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE'
    try {
      if (user?.id) {
        await workerService.toggleWorkerDuty(user.id, next)
      }
      setDutyStatus(next)
    } catch (err) {
      alert(err.message || 'Failed to update duty status.')
    } finally {
      setIsTogglingDuty(false)
    }
  }

  // Task breakdown by status
  const pendingAcceptanceTasks = tasks.filter(
    (t) => t.status === COMPLAINT_STATUSES.ASSIGNED && t.taskStatus !== 'ACCEPTED'
  )
  const acceptedTasks = tasks.filter(
    (t) => t.status === COMPLAINT_STATUSES.ASSIGNED && t.taskStatus === 'ACCEPTED'
  )
  const inProgressTasks = tasks.filter((t) => t.status === COMPLAINT_STATUSES.IN_PROGRESS)
  const resolvedTasks = tasks.filter(
    (t) => t.status === COMPLAINT_STATUSES.RESOLVED || t.status === COMPLAINT_STATUSES.CLOSED
  )

  // Active tasks visible on dashboard (exclude completed)
  const activeTasks = [...pendingAcceptanceTasks, ...acceptedTasks, ...inProgressTasks]

  return (
    <div className="cf-worker-dashboard-page">
      {/* ── Page Header ── */}
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">
            {user?.name || 'Field Technician'} — Operations Terminal
          </h1>
          <p className="cf-page-subtitle">
            {user?.department || 'Field Operations'}&nbsp;•&nbsp;
            {user?.skills?.join(', ') || 'Civic Repair Specialist'}
          </p>
        </div>
        <div className="cf-inline-wrap" style={{ gap: 'var(--space-3)' }}>
          <button
            type="button"
            className={`btn ${dutyStatus === 'AVAILABLE' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 700 }}
            onClick={handleToggleDuty}
            disabled={isTogglingDuty}
          >
            {dutyStatus === 'AVAILABLE' ? 'On Duty' : 'Off Duty'}
          </button>
          <Link to="/worker/complaints">
            <Button variant="secondary">View All Tasks ({tasks.length})</Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner />
        </div>
      ) : (
        <>
          {/* ── KPI Metric Cards ── */}
          <div className="cf-admin-kpi-grid">
            <div
              className="cf-admin-kpi-card clickable"
              onClick={() => navigate('/worker/complaints')}
            >
              <div className="cf-akc-content">
                <span className="cf-akc-label">Pending Acceptance</span>
                <span className="cf-akc-value">{pendingAcceptanceTasks.length}</span>
                <span className="cf-akc-sub">New assignments requiring confirmation</span>
              </div>
            </div>

            <div
              className="cf-admin-kpi-card clickable"
              onClick={() => navigate('/worker/complaints')}
            >
              <div className="cf-akc-content">
                <span className="cf-akc-label">Work In Progress</span>
                <span className="cf-akc-value">{inProgressTasks.length}</span>
                <span className="cf-akc-sub">Active field repairs underway</span>
              </div>
            </div>

            <div
              className="cf-admin-kpi-card clickable"
              onClick={() => navigate('/worker/complaints')}
            >
              <div className="cf-akc-content">
                <span className="cf-akc-label">Completed Repairs</span>
                <span className="cf-akc-value">{resolvedTasks.length}</span>
                <span className="cf-akc-sub">Successfully resolved and closed</span>
              </div>
            </div>

            <div className="cf-admin-kpi-card">
              <div className="cf-akc-content">
                <span className="cf-akc-label">Citizen Rating</span>
                <span className="cf-akc-value">{user?.rating || '4.9'} / 5.0</span>
                <span className="cf-akc-sub">Based on verified citizen reviews</span>
              </div>
            </div>
          </div>

          {/* ── Active Task Queue ── */}
          <div className="cf-admin-section-box">
            <div className="cf-asb-header">
              <div>
                <h2 className="cf-asb-title">Active Repair Queue</h2>
                <p className="cf-asb-desc">
                  Immediate civic repair orders dispatched to your terminal by the Department Authority.
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate('/worker/complaints')}>
                Full Task History →
              </Button>
            </div>

            {activeTasks.length === 0 ? (
              <div
                style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-neutral-500)' }}
              >
                <h3 style={{ margin: 0, color: 'var(--color-neutral-800)' }}>
                  All Tasks Completed
                </h3>
                <p style={{ fontSize: '0.875rem', margin: '4px 0 0', color: 'var(--color-neutral-500)' }}>
                  No pending repair assignments. Remain on duty to receive new dispatches.
                </p>
              </div>
            ) : (
              <div className="cf-master-complaints-cards-grid">
                {activeTasks.map((task) => {
                  const locationStr =
                    typeof task.location === 'object'
                      ? task.location.address || task.location.area
                      : task.location

                  const isPendingAcceptance =
                    task.status === COMPLAINT_STATUSES.ASSIGNED && task.taskStatus !== 'ACCEPTED'
                  const isAccepted =
                    task.status === COMPLAINT_STATUSES.ASSIGNED && task.taskStatus === 'ACCEPTED'
                  const isInProgress = task.status === COMPLAINT_STATUSES.IN_PROGRESS

                  const actionLabel = isPendingAcceptance
                    ? 'Accept Task'
                    : isAccepted
                    ? 'Start Work'
                    : isInProgress
                    ? 'Submit Completion'
                    : 'View Details'

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
                          <span className="label">Priority Level</span>
                          <span className="val">
                            <ComplaintPriority priority={task.priority} />
                          </span>
                        </div>
                      </div>

                      <div className="cf-mcc-footer">
                        <ComplaintStatus status={task.status} />
                        <Button
                          size="sm"
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
        </>
      )}
    </div>
  )
}
