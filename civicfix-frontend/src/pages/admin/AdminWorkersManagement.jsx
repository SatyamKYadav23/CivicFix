import { useState, useEffect, useMemo, useCallback } from 'react'
import { userService } from '../../services/userService.js'
import { complaintService } from '../../services/complaintService.js'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { ErrorState } from '../../components/ui/ErrorState.jsx'

export function AdminWorkersManagement() {
  const [workers, setWorkers] = useState([])
  const [authorities, setAuthorities] = useState([])
  const [complaints, setComplaints] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('ALL')
  const [viewMode, setViewMode] = useState('CARDS') // 'CARDS' | 'TABLE'

  const loadData = useCallback(() => {
    setIsLoading(true)
    setError(null)
    Promise.all([
      userService.getWorkers(),
      userService.getAuthorities(),
      complaintService.getComplaints(),
    ])
      .then(([workerData, authData, complaintData]) => {
        setWorkers(workerData)
        setAuthorities(authData)
        setComplaints(complaintData)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load technician roster.')
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleToggleStatus = async (workerId) => {
    try {
      await userService.toggleUserStatus(workerId, { name: 'System Super-Admin', role: 'ADMIN' })
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to update worker status.')
    }
  }

  const departmentsList = useMemo(() => {
    const set = new Set()
    workers.forEach((w) => {
      if (w.department) set.add(w.department)
    })
    return Array.from(set)
  }, [workers])

  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (selectedDept !== 'ALL' && w.department !== selectedDept) {
        return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = w.name?.toLowerCase().includes(q)
        const matchEmail = w.email?.toLowerCase().includes(q)
        const matchDept = w.department?.toLowerCase().includes(q)
        const matchSkill = w.skills?.some((s) => s.toLowerCase().includes(q))
        if (!matchName && !matchEmail && !matchDept && !matchSkill) return false
      }
      return true
    })
  }, [workers, search, selectedDept])

  if (error) {
    return (
      <ErrorState
        title="Failed to load technicians"
        description={error}
        onRetry={loadData}
      />
    )
  }

  return (
    <div className="cf-admin-workers-page">
      {/* 1. Header */}
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Municipal Field Workforce Roster</h1>
          <p className="cf-page-subtitle">
            All dispatched field technicians, assigned municipal divisions, and active task capacities across wards.
          </p>
        </div>

        <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)' }}>
          <button
            type="button"
            className={`btn ${viewMode === 'CARDS' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
            onClick={() => setViewMode('CARDS')}
          >
            Cards
          </button>
          <button
            type="button"
            className={`btn ${viewMode === 'TABLE' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
            onClick={() => setViewMode('TABLE')}
          >
            Table
          </button>
        </div>
      </div>

      {/* 2. Control Bar */}
      <div className="cf-auth-control-bar">
        <div className="cf-search-input-wrap">
          <span className="cf-siw-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search workers by name, skills, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cf-search-input"
          />
        </div>

        <div className="cf-dept-filter-pills">
          <button
            type="button"
            className={`cf-cat-pill ${selectedDept === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setSelectedDept('ALL')}
          >
            All Divisions ({workers.length})
          </button>
          {departmentsList.map((dept) => (
            <button
              key={dept}
              type="button"
              className={`cf-cat-pill ${selectedDept === dept ? 'is-active' : ''}`}
              onClick={() => setSelectedDept(dept)}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner />
        </div>
      ) : filteredWorkers.length === 0 ? (
        <EmptyState
          title="No Technicians Found"
          description={search ? 'No workers match your search query.' : 'No field workers registered in the platform.'}
        />
      ) : viewMode === 'CARDS' ? (
        <div className="cf-workers-master-grid">
          {filteredWorkers.map((worker) => {
            const managingAuth = authorities.find(
              (a) => a.id === worker.managingAuthorityId || a.department === worker.department
            )
            const activeAssignedTasks = complaints.filter(
              (c) => c.assignedWorker?.id === worker.id && c.status !== 'CLOSED' && c.status !== 'RESOLVED'
            )
            const isActive = worker.status !== 'INACTIVE'

            return (
              <div key={worker.id} className="cf-worker-master-card">
                <div className="cf-wmc-top">
                  <div className="cf-wmc-identity">
                    <div className="cf-wmc-avatar">
                      {worker.avatar ? (
                        <img src={worker.avatar} alt={worker.name} />
                      ) : (
                        <span>{worker.name ? worker.name.charAt(0).toUpperCase() : 'W'}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="cf-wmc-name">{worker.name}</h3>
                      <span className="cf-wmc-dept">{worker.department}</span>
                    </div>
                  </div>
                  <Badge variant={isActive ? 'success' : 'neutral'}>
                    {isActive ? 'ON DUTY' : 'OFFLINE'}
                  </Badge>
                </div>

                <div className="cf-wmc-authority-box">
                  <span className="label">Managed by Authority:</span>
                  <span className="val">
                    {managingAuth ? managingAuth.name : 'Zonal Department Authority'}
                  </span>
                </div>

                <div className="cf-wmc-details-grid">
                  <div className="cf-wmc-cell">
                    <span className="label">Contact Phone</span>
                    <span className="val">{worker.phone || '+91 98765 43210'}</span>
                  </div>
                  <div className="cf-wmc-cell">
                    <span className="label">Active Tasks</span>
                    <span className="val highlight">{activeAssignedTasks.length} In Progress</span>
                  </div>
                  <div className="cf-wmc-cell">
                    <span className="label">Specialized Skills</span>
                    <span className="val">{worker.skills?.join(', ') || 'General Maintenance'}</span>
                  </div>
                  <div className="cf-wmc-cell">
                    <span className="label">Citizen Rating</span>
                    <span className="val">{worker.rating || '5.0'} / 5.0</span>
                  </div>
                </div>

                <div className="cf-wmc-footer">
                  <span className="cf-wmc-email">{worker.email}</span>
                  <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)' }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleToggleStatus(worker.id)}
                    >
                      {isActive ? 'Mark Offline' : 'Mark Active'}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteWorker(worker.id, worker.name)}
                    >
                      Remove
                    </Button>
                  </div>
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
                <th>Technician Name</th>
                <th>Department Division</th>
                <th>Managing Authority</th>
                <th>Contact</th>
                <th>Active Workload</th>
                <th>Duty Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.map((worker) => {
                const managingAuth = authorities.find(
                  (a) => a.id === worker.managingAuthorityId || a.department === worker.department
                )
                const activeAssignedTasks = complaints.filter(
                  (c) => c.assignedWorker?.id === worker.id && c.status !== 'CLOSED' && c.status !== 'RESOLVED'
                )
                const isActive = worker.status !== 'INACTIVE'

                return (
                  <tr key={worker.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-neutral-950)' }}>{worker.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>{worker.skills?.join(', ')}</div>
                    </td>
                    <td>
                      <span className="cf-cct-tag">{worker.department}</span>
                    </td>
                    <td>🛡️ {managingAuth ? managingAuth.name : 'Nodal Officer'}</td>
                    <td>
                      <div>{worker.phone}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>{worker.email}</div>
                    </td>
                    <td>
                      <Badge variant={activeAssignedTasks.length > 0 ? 'warning' : 'neutral'}>
                        {activeAssignedTasks.length} Active Tasks
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={isActive ? 'success' : 'neutral'}>
                        {isActive ? 'ON DUTY' : 'OFFLINE'}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleToggleStatus(worker.id)}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
