import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useComplaints } from '../../hooks/useComplaints.js'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { ErrorState } from '../../components/ui/ErrorState.jsx'
import { ComplaintStatus } from '../../components/complaint/ComplaintStatus.jsx'
import { ComplaintPriority } from '../../components/complaint/ComplaintPriority.jsx'
import { COMPLAINT_STATUSES } from '../../utils/constants.js'
import { formatRelativeTime } from '../../utils/formatters.js'

function getProgressStepIndex(status) {
  switch (status) {
    case COMPLAINT_STATUSES.REPORTED:
      return 0
    case COMPLAINT_STATUSES.UNDER_REVIEW:
      return 1
    case COMPLAINT_STATUSES.ASSIGNED:
    case COMPLAINT_STATUSES.IN_PROGRESS:
      return 2
    case COMPLAINT_STATUSES.RESOLVED:
    case COMPLAINT_STATUSES.CLOSED:
      return 3
    default:
      return 0
  }
}

export function MyComplaints() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'ACTIVE' | 'AWAITING_RATING' | 'CLOSED'
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [sortBy, setSortBy] = useState('NEWEST')

  const { complaints, isLoading, error, refetch } = useComplaints({
    citizenId: user?.id,
    citizenName: user?.name,
    citizenEmail: user?.email,
  })

  // Extract unique categories from user complaints
  const availableCategories = useMemo(() => {
    const set = new Set()
    complaints.forEach((c) => {
      if (c.category) set.add(c.category)
    })
    return Array.from(set)
  }, [complaints])

  // Counts for top metric tabs
  const counts = useMemo(() => {
    const total = complaints.length
    const active = complaints.filter(
      (c) =>
        c.status === COMPLAINT_STATUSES.REPORTED ||
        c.status === COMPLAINT_STATUSES.UNDER_REVIEW ||
        c.status === COMPLAINT_STATUSES.ASSIGNED ||
        c.status === COMPLAINT_STATUSES.IN_PROGRESS
    ).length
    const awaitingRating = complaints.filter(
      (c) => c.status === COMPLAINT_STATUSES.RESOLVED
    ).length
    const closed = complaints.filter(
      (c) => c.status === COMPLAINT_STATUSES.CLOSED
    ).length

    return { total, active, awaitingRating, closed }
  }, [complaints])

  // Filter and Sort logic
  const filteredComplaints = useMemo(() => {
    let result = complaints.filter((c) => {
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesTitle = c.title?.toLowerCase().includes(q)
        const matchesId = c.id?.toLowerCase().includes(q)
        const matchesDesc = c.description?.toLowerCase().includes(q)
        const matchesLoc =
          typeof c.location === 'object'
            ? (c.location.address || c.location.area || '').toLowerCase().includes(q)
            : (c.location || '').toLowerCase().includes(q)

        if (!matchesTitle && !matchesId && !matchesDesc && !matchesLoc) return false
      }

      // Status Filter
      if (statusFilter === 'ACTIVE') {
        const isActive =
          c.status === COMPLAINT_STATUSES.REPORTED ||
          c.status === COMPLAINT_STATUSES.UNDER_REVIEW ||
          c.status === COMPLAINT_STATUSES.ASSIGNED ||
          c.status === COMPLAINT_STATUSES.IN_PROGRESS
        if (!isActive) return false
      } else if (statusFilter === 'AWAITING_RATING') {
        if (c.status !== COMPLAINT_STATUSES.RESOLVED) return false
      } else if (statusFilter === 'CLOSED') {
        if (c.status !== COMPLAINT_STATUSES.CLOSED) return false
      }

      // Category filter
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) {
        return false
      }

      return true
    })

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      }
      if (sortBy === 'OLDEST') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      }
      if (sortBy === 'PRIORITY') {
        const pWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
        return (pWeight[b.priority] || 0) - (pWeight[a.priority] || 0)
      }
      return 0
    })

    return result
  }, [complaints, search, statusFilter, selectedCategory, sortBy])

  const handleReset = () => {
    setSearch('')
    setStatusFilter('ALL')
    setSelectedCategory('ALL')
    setSortBy('NEWEST')
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load your complaints"
        description={error}
        onRetry={refetch}
      />
    )
  }

  return (
    <div className="cf-my-complaints-page">
      {/* 1. Header with Report Action */}
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">My Reported Issues</h1>
          <p className="cf-page-subtitle">
            Track real-time progress, view technician updates, and inspect completed repair proofs.
          </p>
        </div>
        <Link to="/citizen/complaints/new">
          <Button size="lg">+ Report New Issue</Button>
        </Link>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner />
        </div>
      ) : (
        <>
          {/* 2. Top Interactive Status Cards */}
          <div className="cf-status-cards-grid">
            <div
              className={`cf-status-card-item ${statusFilter === 'ALL' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
              role="button"
              tabIndex={0}
            >
              <div className="cf-sci-info">
                <span className="cf-sci-count">{counts.total}</span>
                <span className="cf-sci-label">All Issues</span>
              </div>
            </div>

            <div
              className={`cf-status-card-item ${statusFilter === 'ACTIVE' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('ACTIVE')}
              role="button"
              tabIndex={0}
            >
              <div className="cf-sci-info">
                <span className="cf-sci-count">{counts.active}</span>
                <span className="cf-sci-label">In Progress</span>
              </div>
            </div>

            <div
              className={`cf-status-card-item highlight ${statusFilter === 'AWAITING_RATING' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('AWAITING_RATING')}
              role="button"
              tabIndex={0}
            >
              <div className="cf-sci-info">
                <span className="cf-sci-count">{counts.awaitingRating}</span>
                <span className="cf-sci-label">Needs Your Rating</span>
              </div>
            </div>

            <div
              className={`cf-status-card-item ${statusFilter === 'CLOSED' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('CLOSED')}
              role="button"
              tabIndex={0}
            >
              <div className="cf-sci-info">
                <span className="cf-sci-count">{counts.closed}</span>
                <span className="cf-sci-label">Closed & Verified</span>
              </div>
            </div>
          </div>

          {/* 3. Search, Category & Sort Bar */}
          <div className="cf-complaints-control-bar">
            {/* Search Input */}
            <div className="cf-ccb-search-wrap">
              <span className="cf-ccb-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by issue title, location landmark, or Docket ID (e.g. CF-1001)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="cf-ccb-search-input"
              />
              {search && (
                <button
                  type="button"
                  className="cf-clear-btn"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            {availableCategories.length > 1 && (
              <div className="cf-category-filter-row">
                <span className="cf-cat-label">Category:</span>
                <button
                  type="button"
                  className={`cf-cat-pill ${selectedCategory === 'ALL' ? 'is-active' : ''}`}
                  onClick={() => setSelectedCategory('ALL')}
                >
                  All Categories
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`cf-cat-pill ${selectedCategory === cat ? 'is-active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Sort & Count Row */}
            <div className="cf-ccb-meta-row">
              <span className="cf-ccb-result-count">
                Showing <strong>{filteredComplaints.length}</strong> of {complaints.length} complaints
              </span>

              <div className="cf-sort-group">
                <label htmlFor="sort-complaints">Sort by:</label>
                <select
                  id="sort-complaints"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="cf-sort-select"
                >
                  <option value="NEWEST">Newest First</option>
                  <option value="OLDEST">Oldest First</option>
                  <option value="PRIORITY">Highest Urgency</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Complaints List */}
          {filteredComplaints.length === 0 ? (
            <div className="cf-citizen-empty-box">
              <h3>No matching complaints found</h3>
              <p style={{ maxWidth: '45ch', margin: '0 auto var(--space-4)' }}>
                {search || statusFilter !== 'ALL' || selectedCategory !== 'ALL'
                  ? 'Try adjusting your search terms or clearing your filters to see your issues.'
                  : 'You haven’t reported any civic complaints yet. Report an issue to track resolution.'}
              </p>
              {search || statusFilter !== 'ALL' || selectedCategory !== 'ALL' ? (
                <Button variant="secondary" onClick={handleReset}>
                  Clear All Filters
                </Button>
              ) : (
                <Link to="/citizen/complaints/new">
                  <Button>Report a Civic Issue</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="cf-complaints-cards-stream">
              {filteredComplaints.map((c) => {
                const locationText =
                  typeof c.location === 'object'
                    ? c.location.address || c.location.area || 'Location logged'
                    : c.location || 'Location logged'

                const isAwaitingRating = c.status === COMPLAINT_STATUSES.RESOLVED
                const isClosed = c.status === COMPLAINT_STATUSES.CLOSED
                const currentStepIdx = getProgressStepIndex(c.status)

                return (
                  <div
                    key={c.id}
                    className={`cf-complaint-feed-card ${isAwaitingRating ? 'needs-rating' : ''}`}
                    onClick={() => navigate(`/citizen/complaints/${c.id}`)}
                  >
                    {/* Header: ID, Category & Time */}
                    <div className="cf-cfc-top-bar">
                      <div className="cf-cfc-id-tag">
                        <span className="cf-cfc-id">{c.id}</span>
                        <span className="cf-cfc-category">{c.category || 'General Civic'}</span>
                      </div>
                      <span className="cf-cfc-time">
                        Reported {formatRelativeTime(c.createdAt)}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="cf-cfc-title">{c.title}</h3>
                    {c.description && (
                      <p className="cf-cfc-desc">{c.description}</p>
                    )}

                    {/* Interactive 4-Step Progress Track Bar */}
                    <div className="cf-card-progress-bar">
                      <div className="cf-cpb-track">
                        <div
                          className="cf-cpb-fill"
                          style={{ width: `${((currentStepIdx + 1) / 4) * 100}%` }}
                        />
                      </div>
                      <div className="cf-cpb-steps">
                        <span className={currentStepIdx >= 0 ? 'is-done' : ''}>1. Reported</span>
                        <span className={currentStepIdx >= 1 ? 'is-done' : ''}>2. In Review</span>
                        <span className={currentStepIdx >= 2 ? 'is-done' : ''}>3. Dispatched</span>
                        <span className={currentStepIdx >= 3 ? 'is-done' : ''}>4. Resolved</span>
                      </div>
                    </div>

                    {/* Metadata Details */}
                    <div className="cf-cfc-meta-grid">
                      <div className="cf-cfc-meta-cell">
                        <span>{locationText}</span>
                      </div>

                      <div className="cf-cfc-meta-cell">
                        <span>
                          {c.assignedWorker
                            ? `Assigned to ${c.assignedWorker.name || c.assignedWorker}`
                            : 'Awaiting technician assignment'}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer: Badges & Action */}
                    <div className="cf-cfc-footer">
                      <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)' }}>
                        <ComplaintPriority priority={c.priority} />
                        <ComplaintStatus status={c.status} />
                      </div>

                      <div className="cf-cfc-actions">
                        {isAwaitingRating ? (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/citizen/complaints/${c.id}`)
                            }}
                          >
                            Verify & Rate →
                          </Button>
                        ) : isClosed ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/citizen/complaints/${c.id}`)
                            }}
                          >
                            View Resolution →
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/citizen/complaints/${c.id}`)
                            }}
                          >
                            Track Progress →
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
