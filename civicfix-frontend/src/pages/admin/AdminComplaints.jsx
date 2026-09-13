import { useState, useMemo } from 'react'
import { useComplaints } from '../../hooks/useComplaints.js'
import { ComplaintStatus, ComplaintPriority } from '../../components/complaint/index.js'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { ErrorState } from '../../components/ui/ErrorState.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { formatDate, formatRelativeTime, getAssetUrl } from '../../utils/formatters.js'
import { COMPLAINT_STATUSES, COMPLAINT_PRIORITIES, CATEGORIES } from '../../utils/constants.js'

// Realistic category imagery for defect cards
const CATEGORY_IMAGES = {
  roads: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
  streetlights: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  water: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
  sanitation: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
  drainage: 'https://images.unsplash.com/photo-1527489377706-5bf97e608852?w=600&auto=format&fit=crop&q=80',
  parks: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&auto=format&fit=crop&q=80',
  transport: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
}

function getComplaintImage(complaint) {
  if (complaint.imageUrl) {
    return getAssetUrl(complaint.imageUrl)
  }
  if (Array.isArray(complaint.photos) && complaint.photos[0]) {
    const photo = complaint.photos[0]
    const raw = typeof photo === 'string' ? photo : photo.previewUrl || photo.url
    if (raw) return getAssetUrl(raw)
  }
  if (Array.isArray(complaint.evidence) && complaint.evidence[0]) {
    const ev = complaint.evidence[0]
    const raw = typeof ev === 'string' ? ev : ev.previewUrl || ev.url
    if (raw) return getAssetUrl(raw)
  }
  const cat = (complaint.category || '').toLowerCase()
  if (cat.includes('road') || cat.includes('pothole')) return CATEGORY_IMAGES.roads
  if (cat.includes('light')) return CATEGORY_IMAGES.streetlights
  if (cat.includes('water') || cat.includes('leak')) return CATEGORY_IMAGES.water
  if (cat.includes('sanitation') || cat.includes('garbage') || cat.includes('waste')) return CATEGORY_IMAGES.sanitation
  if (cat.includes('drain') || cat.includes('sewage')) return CATEGORY_IMAGES.drainage
  if (cat.includes('park')) return CATEGORY_IMAGES.parks
  if (cat.includes('transport') || cat.includes('traffic')) return CATEGORY_IMAGES.transport
  return CATEGORY_IMAGES.default
}

export function AdminComplaints() {
  const { complaints, isLoading, error, refetch } = useComplaints()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('NEWEST')
  const [viewMode, setViewMode] = useState('CARDS') // 'CARDS' | 'TABLE'

  // Inspection Modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6

  // Status Metrics counts
  const totalCount = complaints.length
  const underReviewCount = complaints.filter(
    (c) => c.status === COMPLAINT_STATUSES.REPORTED || c.status === COMPLAINT_STATUSES.UNDER_REVIEW
  ).length
  const inProgressCount = complaints.filter(
    (c) => c.status === COMPLAINT_STATUSES.ASSIGNED || c.status === COMPLAINT_STATUSES.IN_PROGRESS
  ).length
  const resolvedCount = complaints.filter(
    (c) => c.status === COMPLAINT_STATUSES.RESOLVED || c.status === COMPLAINT_STATUSES.CLOSED
  ).length

  const filteredComplaints = useMemo(() => {
    let result = complaints.filter((c) => {
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchTitle = c.title?.toLowerCase().includes(q)
        const matchId = c.id?.toLowerCase().includes(q)
        const matchLoc = typeof c.location === 'object'
          ? (c.location.address || '').toLowerCase().includes(q)
          : (c.location || '').toLowerCase().includes(q)
        const matchCitizen = c.citizenName?.toLowerCase().includes(q)
        const matchCategory = c.category?.toLowerCase().includes(q)
        if (!matchTitle && !matchId && !matchLoc && !matchCitizen && !matchCategory) return false
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'REVIEW') {
          if (c.status !== COMPLAINT_STATUSES.REPORTED && c.status !== COMPLAINT_STATUSES.UNDER_REVIEW) return false
        } else if (statusFilter === 'IN_PROGRESS') {
          if (c.status !== COMPLAINT_STATUSES.ASSIGNED && c.status !== COMPLAINT_STATUSES.IN_PROGRESS) return false
        } else if (statusFilter === 'RESOLVED') {
          if (c.status !== COMPLAINT_STATUSES.RESOLVED && c.status !== COMPLAINT_STATUSES.CLOSED) return false
        } else if (c.status !== statusFilter) {
          return false
        }
      }

      // Priority filter
      if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) {
        return false
      }

      // Category filter
      if (categoryFilter !== 'ALL') {
        const catLower = (c.category || '').toLowerCase()
        if (!catLower.includes(categoryFilter.toLowerCase())) return false
      }

      return true
    })

    const priorityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }

    result.sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      }
      if (sortBy === 'OLDEST') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      }
      if (sortBy === 'PRIORITY_DESC') {
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0)
      }
      if (sortBy === 'TITLE_AZ') {
        return (a.title || '').localeCompare(b.title || '')
      }
      return 0
    })

    return result
  }, [complaints, search, statusFilter, priorityFilter, categoryFilter, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / pageSize))
  const paginatedComplaints = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredComplaints.slice(start, start + pageSize)
  }, [filteredComplaints, currentPage, pageSize])

  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('ALL')
    setPriorityFilter('ALL')
    setCategoryFilter('ALL')
    setSortBy('NEWEST')
    setCurrentPage(1)
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load master complaints registry"
        description={error}
        onRetry={refetch}
      />
    )
  }

  return (
    <div className="cf-admin-complaints-page">
      {/* 1. Page Header */}
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Global Master Complaints Registry</h1>
          <p className="cf-page-subtitle">
            Platform-wide grievance oversight across all municipal wards, departments, and SLA stages.
          </p>
        </div>

        {/* Segmented View Switcher */}
        <div className="cf-view-mode-switch">
          <button
            type="button"
            className={`cf-view-btn ${viewMode === 'CARDS' ? 'is-active' : ''}`}
            onClick={() => setViewMode('CARDS')}
            title="Card Gallery View"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            Cards
          </button>
          <button
            type="button"
            className={`cf-view-btn ${viewMode === 'TABLE' ? 'is-active' : ''}`}
            onClick={() => setViewMode('TABLE')}
            title="Tabular Data View"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 3h18v18H3z" />
              <path d="M3 9h18" />
              <path d="M3 15h18" />
              <path d="M9 3v18" />
            </svg>
            Table
          </button>
        </div>
      </div>

      {/* 2. Top Status Metrics KPI Bar */}
      <div className="cf-complaints-kpi-bar">
        <button
          type="button"
          className={`cf-kpi-tab-card all ${statusFilter === 'ALL' ? 'is-active' : ''}`}
          onClick={() => { setStatusFilter('ALL'); setCurrentPage(1) }}
        >
          <div className="cf-kpi-top-meta">
            <span className="cf-kpi-val">{totalCount}</span>
            <span className="cf-kpi-indicator all" />
          </div>
          <span className="cf-kpi-label">All Grievances</span>
        </button>

        <button
          type="button"
          className={`cf-kpi-tab-card review ${statusFilter === 'REVIEW' ? 'is-active' : ''}`}
          onClick={() => { setStatusFilter('REVIEW'); setCurrentPage(1) }}
        >
          <div className="cf-kpi-top-meta">
            <span className="cf-kpi-val">{underReviewCount}</span>
            <span className="cf-kpi-indicator review" />
          </div>
          <span className="cf-kpi-label">Under Triage & Review</span>
        </button>

        <button
          type="button"
          className={`cf-kpi-tab-card progress ${statusFilter === 'IN_PROGRESS' ? 'is-active' : ''}`}
          onClick={() => { setStatusFilter('IN_PROGRESS'); setCurrentPage(1) }}
        >
          <div className="cf-kpi-top-meta">
            <span className="cf-kpi-val">{inProgressCount}</span>
            <span className="cf-kpi-indicator progress" />
          </div>
          <span className="cf-kpi-label">In Field Work</span>
        </button>

        <button
          type="button"
          className={`cf-kpi-tab-card resolved ${statusFilter === 'RESOLVED' ? 'is-active' : ''}`}
          onClick={() => { setStatusFilter('RESOLVED'); setCurrentPage(1) }}
        >
          <div className="cf-kpi-top-meta">
            <span className="cf-kpi-val">{resolvedCount}</span>
            <span className="cf-kpi-indicator resolved" />
          </div>
          <span className="cf-kpi-label">Resolved & Closed</span>
        </button>
      </div>

      {/* 3. Modern Control & Filter Toolbar */}
      <div className="cf-complaints-control-box">
        {/* Top search & dropdowns row */}
        <div className="cf-ccb-top-row">
          <div className="cf-search-input-wrap" style={{ flex: 1 }}>
            <span className="cf-siw-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by Docket ID, Citizen, Title, or Ward Address..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              className="cf-search-input"
            />
            {search && (
              <button
                type="button"
                className="cf-siw-clear"
                onClick={() => { setSearch(''); setCurrentPage(1) }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="cf-ccb-selects-wrap">
            <div className="cf-ccb-select-group">
              <label className="cf-ccb-select-label">Priority:</label>
              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1) }}
                className="cf-ccb-select"
              >
                <option value="ALL">All Priorities</option>
                <option value={COMPLAINT_PRIORITIES.CRITICAL}>Critical Priority</option>
                <option value={COMPLAINT_PRIORITIES.HIGH}>High Priority</option>
                <option value={COMPLAINT_PRIORITIES.MEDIUM}>Medium Priority</option>
                <option value={COMPLAINT_PRIORITIES.LOW}>Low Priority</option>
              </select>
            </div>

            <div className="cf-ccb-select-group">
              <label className="cf-ccb-select-label">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="cf-ccb-select"
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="PRIORITY_DESC">Highest Priority</option>
                <option value="TITLE_AZ">Title (A to Z)</option>
              </select>
            </div>

            {(search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL') && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: '0.8125rem', padding: '0.4rem 0.6rem' }}
                onClick={handleResetFilters}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Category / Department Pills row */}
        <div className="cf-dept-filter-pills">
          <button
            type="button"
            className={`cf-cat-pill ${categoryFilter === 'ALL' ? 'is-active' : ''}`}
            onClick={() => { setCategoryFilter('ALL'); setCurrentPage(1) }}
          >
            All Categories ({totalCount})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`cf-cat-pill ${categoryFilter === cat.id ? 'is-active' : ''}`}
              onClick={() => { setCategoryFilter(cat.id); setCurrentPage(1) }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Complaints Content */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner />
        </div>
      ) : filteredComplaints.length === 0 ? (
        <EmptyState
          title="No Grievance Dockets Match Filters"
          description="Try modifying your search term or resetting your category, status, and priority filters."
          action={
            <Button variant="secondary" onClick={handleResetFilters}>
              Reset All Filters
            </Button>
          }
        />
      ) : viewMode === 'CARDS' ? (
        <div className="cf-master-complaints-cards-grid">
          {paginatedComplaints.map((item) => {
            const locationStr = typeof item.location === 'object'
              ? item.location.address || item.location.area
              : item.location
            const workerName = item.assignedWorker?.name || (typeof item.assignedWorker === 'string' ? item.assignedWorker : null)
            const cardImg = getComplaintImage(item)
            const citizenInitials = (item.citizenName || 'C')
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)

            return (
              <div key={item.id} className="cf-master-complaint-card">
                {/* Visual Image Banner with Gradient & Badges */}
                <div className="cf-mcc-banner">
                  <img src={cardImg} alt={item.title} className="cf-mcc-banner-img" />
                  <div className="cf-mcc-banner-overlay" />
                  
                  <div className="cf-mcc-banner-badges">
                    <span className="cf-mcc-dept-tag">{item.category || 'General'}</span>
                    <ComplaintPriority priority={item.priority} />
                  </div>

                  <div className="cf-mcc-banner-bottom">
                    <span className="cf-mcc-docket-id">{item.id}</span>
                    <span className="cf-mcc-banner-time">{formatRelativeTime(item.createdAt)}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="cf-mcc-body">
                  <h3 className="cf-mcc-title">{item.title}</h3>

                  <div className="cf-mcc-location-row">
                    <svg className="cf-mcc-loc-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {locationStr || 'Municipal Jurisdiction'}
                    </span>
                  </div>

                  {/* Citizen & Field Crew Info */}
                  <div className="cf-mcc-meta-chips">
                    <div className="cf-mcc-chip">
                      <span className="cf-mcc-chip-label">Reporter</span>
                      <span className="cf-mcc-chip-val" title={item.citizenName || 'Citizen'}>
                        <span className="cf-user-initial-dot">{citizenInitials}</span>
                        {item.citizenName || 'Citizen'}
                      </span>
                    </div>

                    <div className="cf-mcc-chip">
                      <span className="cf-mcc-chip-label">Assigned Crew</span>
                      <span className="cf-mcc-chip-val">
                        {workerName ? (
                          <>
                            <span className="cf-worker-status-dot" />
                            {workerName}
                          </>
                        ) : (
                          <span style={{ color: 'var(--color-neutral-400)', fontWeight: 400 }}>
                            Pending Dispatch
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badges & Actions Footer */}
                <div className="cf-mcc-footer">
                  <ComplaintStatus status={item.status} />

                  <Button
                    size="sm"
                    variant="secondary"
                    className="cf-inspect-btn"
                    onClick={() => setSelectedComplaint(item)}
                  >
                    Inspect Details →
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="cf-table-responsive">
          <table className="cf-table">
            <thead>
              <tr>
                <th style={{ width: '110px' }}>Docket ID</th>
                <th>Complaint Title</th>
                <th>Category</th>
                <th>Citizen Reporter</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Crew</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedComplaints.map((item) => {
                const locationStr = typeof item.location === 'object'
                  ? item.location.address || item.location.area
                  : item.location
                const workerName = item.assignedWorker?.name || (typeof item.assignedWorker === 'string' ? item.assignedWorker : null)
                const citizenInitials = (item.citizenName || 'C')
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)

                return (
                  <tr key={item.id}>
                    <td>
                      <span className="cf-table-docket-badge">{item.id}</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--color-neutral-950)' }}>{item.title}</strong>
                    </td>
                    <td>
                      <Badge variant="neutral">{item.category || 'General'}</Badge>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <span className="cf-user-initial-dot">{citizenInitials}</span>
                        {item.citizenName || 'Citizen'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-neutral-600)' }}>
                      {locationStr || '—'}
                    </td>
                    <td>
                      <ComplaintPriority priority={item.priority} />
                    </td>
                    <td>
                      <ComplaintStatus status={item.status} />
                    </td>
                    <td>
                      {workerName ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--color-neutral-800)' }}>
                          <span className="cf-worker-status-dot" />
                          {workerName}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-neutral-400)', fontSize: '0.8125rem' }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
                        {formatDate(item.createdAt)}
                      </span>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedComplaint(item)}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Pagination Bar */}
      {filteredComplaints.length > 0 && (
        <div className="cf-pagination-bar">
          <div style={{ fontSize: '0.875rem', color: 'var(--color-neutral-600)' }}>
            Showing <strong>{Math.min(filteredComplaints.length, (currentPage - 1) * pageSize + 1)}</strong> to{' '}
            <strong>{Math.min(filteredComplaints.length, currentPage * pageSize)}</strong> of{' '}
            <strong>{filteredComplaints.length}</strong> complaints
          </div>

          <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)' }}>
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              ← Previous
            </Button>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, padding: '0 var(--space-2)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* 6. Interactive Grievance Inspection Modal */}
      {selectedComplaint && (
        <div className="cf-modal-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="cf-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="cf-mc-header">
              <div>
                <span className="cf-mc-badge">Grievance Inspection Docket</span>
                <h3 className="cf-mc-title" style={{ marginTop: '4px' }}>{selectedComplaint.title}</h3>
                <span className="cf-table-docket-badge" style={{ marginTop: '6px', display: 'inline-block' }}>
                  {selectedComplaint.id}
                </span>
              </div>
              <button
                type="button"
                className="cf-mc-close"
                onClick={() => setSelectedComplaint(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="cf-mcc-details-modal-body" style={{ padding: 'var(--space-5)' }}>
              {/* Status & Priority Row */}
              <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <ComplaintPriority priority={selectedComplaint.priority} />
                <ComplaintStatus status={selectedComplaint.status} />
                <Badge variant="primary">{selectedComplaint.category || 'General'}</Badge>
              </div>

              {/* Description Box */}
              <div className="cf-rdc-desc-box" style={{ marginBottom: 'var(--space-4)', background: 'var(--color-neutral-50)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
                <span className="cf-rdc-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-neutral-500)', textTransform: 'uppercase' }}>
                  Grievance Description
                </span>
                <p style={{ margin: '6px 0 0', color: 'var(--color-neutral-800)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
                  {selectedComplaint.description || 'No additional description provided.'}
                </p>
              </div>

              {/* Meta Grid */}
              <div className="cf-amc-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', display: 'block' }}>Citizen Reporter</span>
                  <strong style={{ color: 'var(--color-neutral-900)' }}>{selectedComplaint.citizenName || 'Verified Citizen'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', display: 'block' }}>Citizen Email</span>
                  <span style={{ color: 'var(--color-neutral-800)' }}>{selectedComplaint.citizenEmail || 'citizen@civicfix.org'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', display: 'block' }}>Incident Location</span>
                  <span style={{ color: 'var(--color-neutral-800)' }}>
                    {typeof selectedComplaint.location === 'object'
                      ? selectedComplaint.location.address
                      : selectedComplaint.location}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', display: 'block' }}>Assigned Field Crew</span>
                  <strong style={{ color: 'var(--color-neutral-900)' }}>
                    {selectedComplaint.assignedWorker?.name || (typeof selectedComplaint.assignedWorker === 'string' ? selectedComplaint.assignedWorker : 'Pending Dispatch')}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', display: 'block' }}>Logged On</span>
                  <span style={{ color: 'var(--color-neutral-800)' }}>{formatDate(selectedComplaint.createdAt)}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', display: 'block' }}>Last Updated</span>
                  <span style={{ color: 'var(--color-neutral-800)' }}>{formatRelativeTime(selectedComplaint.updatedAt || selectedComplaint.createdAt)}</span>
                </div>
              </div>

              {/* Attached Photos */}
              {(() => {
                const photos = (Array.isArray(selectedComplaint.photos) && selectedComplaint.photos.length > 0)
                  ? selectedComplaint.photos
                  : (Array.isArray(selectedComplaint.evidence) && selectedComplaint.evidence.length > 0)
                  ? selectedComplaint.evidence
                  : (selectedComplaint.imageUrl ? [{ url: selectedComplaint.imageUrl, name: 'evidence.jpg' }] : [])

                if (photos.length === 0) return null

                return (
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-neutral-500)', textTransform: 'uppercase' }}>
                      Attached Photo Evidence ({photos.length})
                    </span>
                    <div className="cf-modal-gallery-grid">
                      {photos.map((photo, i) => {
                        const rawSrc = typeof photo === 'object' ? photo.previewUrl || photo.url || photo.preview : photo
                        const src = getAssetUrl(rawSrc)
                        return (
                          <div key={i} className="cf-modal-gallery-item">
                            <a href={src} target="_blank" rel="noopener noreferrer">
                              <img
                                src={src}
                                alt={`Grievance Evidence ${i + 1}`}
                              />
                            </a>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Citizen Feedback Rating if Resolved */}
              {selectedComplaint.feedback && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                    Citizen Satisfaction Review
                  </span>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#15803d', marginTop: '2px' }}>
                    {'★'.repeat(selectedComplaint.feedback.rating || 5)}{'☆'.repeat(5 - (selectedComplaint.feedback.rating || 5))} ({selectedComplaint.feedback.rating}/5)
                  </div>
                  {selectedComplaint.feedback.comment && (
                    <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#14532d' }}>
                      "{selectedComplaint.feedback.comment}"
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="cf-mc-actions" style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--color-neutral-200)', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setSelectedComplaint(null)}>
                Close Docket
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

