import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useComplaints } from '../../hooks/useComplaints.js'
import { ComplaintFilters, ComplaintTable, ComplaintCard, AssignWorkerModal } from '../../components/complaint/index.js'
import { Select } from '../../components/ui/Select.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { ErrorState } from '../../components/ui/ErrorState.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'

export function ComplaintQueue() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const initialFilter = useMemo(() => ({ authorityDepartment: user?.department || null }), [user?.department])
  const { complaints, isLoading, error, refetch } = useComplaints(initialFilter)

  // Filter state
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [priority, setPriority] = useState('ALL')
  const [category, setCategory] = useState('ALL')
  const [assignmentFilter, setAssignmentFilter] = useState('ALL') // 'ALL' | 'ASSIGNED' | 'UNASSIGNED'
  const [sortBy, setSortBy] = useState('NEWEST')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6

  // Assign worker modal state
  const [selectedComplaintForAssign, setSelectedComplaintForAssign] = useState(null)

  // Filter & Sort
  const filteredComplaints = useMemo(() => {
    let result = complaints.filter((c) => {
      if (search) {
        const q = search.toLowerCase()
        const matchesTitle = c.title.toLowerCase().includes(q)
        const matchesId = c.id.toLowerCase().includes(q)
        const matchesLoc = typeof c.location === 'string' && c.location.toLowerCase().includes(q)
        if (!matchesTitle && !matchesId && !matchesLoc) return false
      }

      if (status !== 'ALL' && c.status !== status) return false
      if (priority !== 'ALL' && c.priority !== priority) return false

      if (category !== 'ALL') {
        const catLower = (c.category || '').toLowerCase()
        if (!catLower.includes(category.toLowerCase())) return false
      }

      if (assignmentFilter === 'ASSIGNED' && !c.assignedWorker) return false
      if (assignmentFilter === 'UNASSIGNED' && Boolean(c.assignedWorker)) return false

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
        return a.title.localeCompare(b.title)
      }
      return 0
    })

    return result
  }, [complaints, search, status, priority, category, assignmentFilter, sortBy])

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / pageSize))
  const paginatedComplaints = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredComplaints.slice(start, start + pageSize)
  }, [filteredComplaints, currentPage, pageSize])

  const handleResetFilters = () => {
    setSearch('')
    setStatus('ALL')
    setPriority('ALL')
    setCategory('ALL')
    setAssignmentFilter('ALL')
    setSortBy('NEWEST')
    setCurrentPage(1)
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load complaint queue"
        description={error}
        onRetry={refetch}
      />
    )
  }

  return (
    <div>
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Complaint Management Queue</h1>
          <p className="cf-page-subtitle">
            Review incoming grievances, adjust urgency priority, and dispatch field technicians.
          </p>
        </div>
      </div>

      {/* Multi-Filter Toolbar */}
      <div className="cf-queue-filter-area">
        <ComplaintFilters
          searchTerm={search}
          status={status}
          priority={priority}
          category={category}
          onSearchChange={(v) => { setSearch(v); setCurrentPage(1) }}
          onStatusChange={(v) => { setStatus(v); setCurrentPage(1) }}
          onPriorityChange={(v) => { setPriority(v); setCurrentPage(1) }}
          onCategoryChange={(v) => { setCategory(v); setCurrentPage(1) }}
          onReset={handleResetFilters}
          totalCount={filteredComplaints.length}
        />

        {/* Additional Filters & Sorting Row */}
        <div className="cf-queue-secondary-filters">
          <div className="cf-queue-filter-control">
            <Select
              id="assign-filter"
              label="Assignment Status"
              value={assignmentFilter}
              onChange={(e) => { setAssignmentFilter(e.target.value); setCurrentPage(1) }}
              options={[
                { value: 'ALL', label: 'All Assignments' },
                { value: 'UNASSIGNED', label: 'Unassigned Only' },
                { value: 'ASSIGNED', label: 'Assigned Only' },
              ]}
            />
          </div>

          <div className="cf-queue-filter-control">
            <Select
              id="sort-queue"
              label="Sort Queue By"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'NEWEST', label: 'Newest First' },
                { value: 'OLDEST', label: 'Oldest First' },
                { value: 'PRIORITY_DESC', label: 'Highest Priority' },
                { value: 'TITLE_AZ', label: 'Title (A to Z)' },
              ]}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner />
        </div>
      ) : filteredComplaints.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="cf-desktop-only">
            <ComplaintTable
              complaints={paginatedComplaints}
              role="AUTHORITY"
              onView={(item) => navigate(`/authority/complaints/${item.id}`)}
              onAssign={(item) => setSelectedComplaintForAssign(item)}
            />
          </div>

          {/* Mobile Card Grid View */}
          <div className="cf-mobile-only" style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {paginatedComplaints.map((c) => (
              <ComplaintCard
                key={c.id}
                complaint={c}
                role="AUTHORITY"
                onView={(item) => navigate(`/authority/complaints/${item.id}`)}
                onAction={(item) => setSelectedComplaintForAssign(item)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
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
        </>
      ) : (
        <EmptyState
          title="No complaints in queue"
          description={
            search || status !== 'ALL' || priority !== 'ALL' || category !== 'ALL' || assignmentFilter !== 'ALL'
              ? 'No grievances match your search and filter criteria.'
              : 'The municipal queue is currently clear.'
          }
          action={
            <Button variant="secondary" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          }
        />
      )}

      {/* Worker Assignment Modal */}
      <AssignWorkerModal
        isOpen={Boolean(selectedComplaintForAssign)}
        complaint={selectedComplaintForAssign}
        onClose={() => setSelectedComplaintForAssign(null)}
        onAssigned={() => {
          setSelectedComplaintForAssign(null)
          refetch()
        }}
      />
    </div>
  )
}
