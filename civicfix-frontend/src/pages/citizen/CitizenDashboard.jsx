import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { complaintService } from '../../services/complaintService.js'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { ErrorState } from '../../components/ui/ErrorState.jsx'
import { ComplaintStatus } from '../../components/complaint/ComplaintStatus.jsx'
import { ComplaintPriority } from '../../components/complaint/ComplaintPriority.jsx'
import { COMPLAINT_STATUSES } from '../../utils/constants.js'
import { formatRelativeTime, getAssetUrl } from '../../utils/formatters.js'

const CATEGORY_IMAGES = {
  roads: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
  streetlights: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  water: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
  sanitation: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
  drainage: 'https://images.unsplash.com/photo-1527489377706-5bf97e608852?w=600&auto=format&fit=crop&q=80',
  parks: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
}

function getIssueThumb(c) {
  if (c.imageUrl) return getAssetUrl(c.imageUrl)
  if (Array.isArray(c.photos) && c.photos[0]) {
    const p = c.photos[0]
    return getAssetUrl(typeof p === 'string' ? p : p.previewUrl || p.url || p.preview)
  }
  if (Array.isArray(c.evidence) && c.evidence[0]) {
    const ev = c.evidence[0]
    return getAssetUrl(typeof ev === 'string' ? ev : ev.previewUrl || ev.url || ev.preview)
  }
  const cat = (c.category || '').toLowerCase()
  if (cat.includes('road') || cat.includes('pothole')) return CATEGORY_IMAGES.roads
  if (cat.includes('light')) return CATEGORY_IMAGES.streetlights
  if (cat.includes('water') || cat.includes('leak')) return CATEGORY_IMAGES.water
  if (cat.includes('sanitation') || cat.includes('garbage')) return CATEGORY_IMAGES.sanitation
  if (cat.includes('drain') || cat.includes('sewage')) return CATEGORY_IMAGES.drainage
  if (cat.includes('park')) return CATEGORY_IMAGES.parks
  return CATEGORY_IMAGES.default
}

function getStageIndex(status) {
  switch (status) {
    case COMPLAINT_STATUSES.REPORTED:
      return 1
    case COMPLAINT_STATUSES.UNDER_REVIEW:
      return 2
    case COMPLAINT_STATUSES.ASSIGNED:
    case COMPLAINT_STATUSES.IN_PROGRESS:
      return 3
    case COMPLAINT_STATUSES.RESOLVED:
    case COMPLAINT_STATUSES.CLOSED:
      return 4
    default:
      return 1
  }
}

export function CitizenDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [complaints, setComplaints] = useState([])
  const [activeFilter, setActiveFilter] = useState('ALL') // 'ALL' | 'ACTIVE' | 'RESOLVED'
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback(() => {
    setIsLoading(true)
    setError(null)
    complaintService
      .getComplaints({ citizenId: user?.id })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.complaints || data?.items || [])
        setComplaints(list)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load your complaints.')
        setIsLoading(false)
      })
  }, [user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const safeComplaints = Array.isArray(complaints) ? complaints : []
  const totalCount = safeComplaints.length
  const activeCount = safeComplaints.filter(
    (c) =>
      c.status === COMPLAINT_STATUSES.REPORTED ||
      c.status === COMPLAINT_STATUSES.UNDER_REVIEW ||
      c.status === COMPLAINT_STATUSES.ASSIGNED ||
      c.status === COMPLAINT_STATUSES.IN_PROGRESS
  ).length
  const awaitingFeedbackCount = safeComplaints.filter(
    (c) => c.status === COMPLAINT_STATUSES.RESOLVED
  ).length
  const closedCount = safeComplaints.filter(
    (c) => c.status === COMPLAINT_STATUSES.CLOSED
  ).length

  // Filtered list
  const filteredComplaints = useMemo(() => {
    return safeComplaints.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = c.title?.toLowerCase().includes(q)
        const matchId = c.id?.toLowerCase().includes(q)
        const matchLoc = typeof c.location === 'object'
          ? (c.location.address || '').toLowerCase().includes(q)
          : (c.location || '').toLowerCase().includes(q)
        if (!matchTitle && !matchId && !matchLoc) return false
      }

      if (activeFilter === 'ACTIVE') {
        return (
          c.status === COMPLAINT_STATUSES.REPORTED ||
          c.status === COMPLAINT_STATUSES.UNDER_REVIEW ||
          c.status === COMPLAINT_STATUSES.ASSIGNED ||
          c.status === COMPLAINT_STATUSES.IN_PROGRESS
        )
      }
      if (activeFilter === 'RESOLVED') {
        return (
          c.status === COMPLAINT_STATUSES.RESOLVED ||
          c.status === COMPLAINT_STATUSES.CLOSED
        )
      }
      return true
    })
  }, [complaints, activeFilter, searchQuery])

  // Complaint awaiting rating
  const firstAwaitingFeedback = complaints.find(
    (c) => c.status === COMPLAINT_STATUSES.RESOLVED
  )

  if (error) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        description={error}
        onRetry={loadData}
      />
    )
  }

  return (
    <div className="cf-citizen-dashboard">
      {/* 1. Header */}
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Citizen Grievance Portal</h1>
          <p className="cf-page-subtitle">
            Welcome back, {user?.name || 'Citizen'}. Track submitted civic complaints, review field progress, and access municipal services.
          </p>
        </div>
        <Link to="/citizen/complaints/new">
          <Button size="lg">+ Report a New Issue</Button>
        </Link>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner />
        </div>
      ) : (
        <>
          {/* 2. Action Required Banner */}
          {firstAwaitingFeedback && (
            <div className="cf-citizen-action-alert">
              <div className="cf-caa-body">
                <strong>Action Required: Repair Verification & Citizen Rating</strong>
                <p>
                  "{firstAwaitingFeedback.title}" ({firstAwaitingFeedback.id}) has been repaired by the dispatched field crew.
                  Please review the resolution photos and submit your rating.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`/citizen/complaints/${firstAwaitingFeedback.id}`)}
              >
                Review & Rate →
              </Button>
            </div>
          )}

          {/* 3. Interactive KPI Metrics Bar */}
          <div className="cf-citizen-metrics-bar">
            <div
              className={`cf-citizen-metric-card ${activeFilter === 'ALL' ? 'is-active' : ''}`}
              onClick={() => setActiveFilter('ALL')}
              role="button"
              tabIndex={0}
            >
              <div className="cf-cmc-number">{totalCount}</div>
              <div className="cf-cmc-label">Total Reported Dockets</div>
            </div>

            <div
              className={`cf-citizen-metric-card ${activeFilter === 'ACTIVE' ? 'is-active' : ''}`}
              onClick={() => setActiveFilter('ACTIVE')}
              role="button"
              tabIndex={0}
            >
              <div className="cf-cmc-number">{activeCount}</div>
              <div className="cf-cmc-label">In Progress & Active</div>
            </div>

            <div
              className={`cf-citizen-metric-card ${activeFilter === 'RESOLVED' ? 'is-active' : ''}`}
              onClick={() => setActiveFilter('RESOLVED')}
              role="button"
              tabIndex={0}
            >
              <div className="cf-cmc-number">{awaitingFeedbackCount + closedCount}</div>
              <div className="cf-cmc-label">Resolved & Closed</div>
            </div>
          </div>

          {/* 4. Split Layout: Main Complaints Feed + Quick Help Widget */}
          <div className="cf-citizen-split-layout">
            {/* Left: Issues List */}
            <div className="cf-citizen-complaints-section">
              <div className="cf-ccs-header">
                <h2>My Reported Issues ({filteredComplaints.length})</h2>

                <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)' }}>
                  <div style={{ position: 'relative', width: '220px' }}>
                    <input
                      type="text"
                      className="cf-input"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.8125rem' }}
                      placeholder="Search my issues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="cf-filter-pills">
                    <button
                      type="button"
                      className={`cf-filter-pill ${activeFilter === 'ALL' ? 'is-active' : ''}`}
                      onClick={() => setActiveFilter('ALL')}
                    >
                      All ({totalCount})
                    </button>
                    <button
                      type="button"
                      className={`cf-filter-pill ${activeFilter === 'ACTIVE' ? 'is-active' : ''}`}
                      onClick={() => setActiveFilter('ACTIVE')}
                    >
                      Active ({activeCount})
                    </button>
                    <button
                      type="button"
                      className={`cf-filter-pill ${activeFilter === 'RESOLVED' ? 'is-active' : ''}`}
                      onClick={() => setActiveFilter('RESOLVED')}
                    >
                      Resolved ({awaitingFeedbackCount + closedCount})
                    </button>
                  </div>
                </div>
              </div>

              {filteredComplaints.length === 0 ? (
                <div className="cf-citizen-empty-box" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <h3 style={{ margin: 0, color: 'var(--color-neutral-800)' }}>No issues in this view</h3>
                  <p style={{ margin: '6px 0 0', color: 'var(--color-neutral-500)', fontSize: '0.875rem' }}>
                    {activeFilter === 'ACTIVE'
                      ? 'You currently have no active or pending civic complaints.'
                      : activeFilter === 'RESOLVED'
                      ? 'No resolved complaints found in your account history.'
                      : 'You have not reported any civic issues yet.'}
                  </p>
                  <Link to="/citizen/complaints/new" style={{ marginTop: 'var(--space-4)', display: 'inline-block' }}>
                    <Button variant="secondary">+ Report a New Issue</Button>
                  </Link>
                </div>
              ) : (
                <div className="cf-citizen-complaints-list">
                  {filteredComplaints.map((c) => {
                    const locationText =
                      typeof c.location === 'object'
                        ? c.location.address || c.location.area || 'Location on record'
                        : c.location || 'Location on record'
                    const thumb = getIssueThumb(c)
                    const stage = getStageIndex(c.status)

                    return (
                      <div
                        key={c.id}
                        className="cf-citizen-complaint-row"
                        onClick={() => navigate(`/citizen/complaints/${c.id}`)}
                      >
                        <div className="cf-ccr-thumb-wrap">
                          <img src={thumb} alt={c.title} className="cf-ccr-thumb" />
                        </div>

                        <div className="cf-ccr-main">
                          <div className="cf-ccr-top">
                            <span className="cf-ccr-id">{c.id}</span>
                            <span className="cf-ccr-cat">{c.category}</span>
                            <span className="cf-ccr-time">{formatRelativeTime(c.updatedAt || c.createdAt)}</span>
                          </div>

                          <h3 className="cf-ccr-title">{c.title}</h3>

                          <div className="cf-ccr-loc">
                            <span>{locationText}</span>
                            {c.assignedWorker && (
                              <span> • Technician: {c.assignedWorker.name || c.assignedWorker}</span>
                            )}
                          </div>

                          {/* 4-Step Status Progress Bar */}
                          <div className="cf-status-stepper-mini" title={`Stage ${stage} of 4: ${c.status}`}>
                            <div className={`cf-ssm-dot ${stage >= 1 ? 'is-done' : ''}`} />
                            <div className={`cf-ssm-dot ${stage >= 2 ? 'is-done' : ''}`} />
                            <div className={`cf-ssm-dot ${stage >= 3 ? 'is-done' : ''}`} />
                            <div className={`cf-ssm-dot ${stage >= 4 ? 'is-done' : ''}`} />
                            <span style={{ fontSize: '0.6875rem', color: 'var(--color-neutral-500)', marginLeft: '4px' }}>
                              {stage === 4 ? 'Resolved' : stage === 3 ? 'In Field Repair' : stage === 2 ? 'Under Review' : 'Reported'}
                            </span>
                          </div>
                        </div>

                        <div className="cf-ccr-right">
                          <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)' }}>
                            <ComplaintPriority priority={c.priority} />
                            <ComplaintStatus status={c.status} />
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/citizen/complaints/${c.id}`)
                            }}
                          >
                            {c.status === COMPLAINT_STATUSES.RESOLVED ? 'Rate & Close →' : 'Track Details →'}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right: Quick Services & Helpline Widget */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="cf-citizen-sidebar-widget">
                <h3 className="cf-csw-title">Quick Services</h3>
                <div className="cf-quick-action-links">
                  <Link to="/citizen/complaints/new" className="cf-qal-item">
                    <span>Report Road & Pothole Hazard</span>
                    <span>→</span>
                  </Link>
                  <Link to="/citizen/complaints/new" className="cf-qal-item">
                    <span>Report Water Leakage</span>
                    <span>→</span>
                  </Link>
                  <Link to="/citizen/complaints/new" className="cf-qal-item">
                    <span>Report Streetlight Failure</span>
                    <span>→</span>
                  </Link>
                  <Link to="/citizen/complaints/new" className="cf-qal-item">
                    <span>Report Waste & Garbage Overflow</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              <div className="cf-citizen-sidebar-widget">
                <h3 className="cf-csw-title">Municipal Helpline & Ward</h3>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-neutral-600)', display: 'grid', gap: 'var(--space-2)' }}>
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Assigned Municipal Zone</span>
                    <div style={{ fontWeight: 600, color: 'var(--color-neutral-900)' }}>Central & North Ward — Zone 12</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Civic Triage SLA</span>
                    <div style={{ fontWeight: 600, color: '#15803d' }}>Average 24–48 Hours Resolution</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-neutral-400)', textTransform: 'uppercase' }}>Control Room Helpline</span>
                    <div style={{ fontWeight: 600, color: 'var(--color-neutral-900)' }}>1800-CIVIC-FIX (Toll Free)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

