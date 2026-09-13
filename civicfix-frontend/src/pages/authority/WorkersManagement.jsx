import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { authorityService } from '../../services/authorityService.js'
import { workerService } from '../../services/workerService.js'
import { userService } from '../../services/userService.js'
import { complaintService } from '../../services/complaintService.js'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { ErrorState } from '../../components/ui/ErrorState.jsx'

export function WorkersManagement() {
  const { user: authUser } = useAuth()

  const [workers, setWorkers] = useState([])
  const [complaints, setComplaints] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('CARDS') // 'CARDS' | 'TABLE'

  // Modal State for Registering New Worker
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('Worker123!')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('+91 98765 00000')
  const [skillsInput, setSkillsInput] = useState('')
  const [modalError, setModalError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdSuccess, setCreatedSuccess] = useState(null)

  const loadData = useCallback(() => {
    setIsLoading(true)
    setError(null)
    Promise.all([
      authorityService.getWorkers(),
      complaintService.getComplaints(),
    ])
      .then(([workerList, complaintList]) => {
        setWorkers(Array.isArray(workerList) ? workerList : [])
        setComplaints(Array.isArray(complaintList) ? complaintList : [])
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load field worker roster.')
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRegisterWorker = async (e) => {
    e.preventDefault()
    setModalError('')
    setIsSubmitting(true)

    const finalPassword = password.trim() || 'Worker123!'

    try {
      const skills = skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      await authorityService.createWorker({
        name: name.trim(),
        email: email.trim(),
        password: finalPassword,
        phone: phone.trim(),
        department: authUser?.department || 'Field Operations Division',
        skills: skills.length > 0 ? skills : ['General Repair & Maintenance'],
      })

      setCreatedSuccess({
        name: name.trim(),
        email: email.trim(),
        password: finalPassword,
        department: authUser?.department || 'Field Operations Division',
      })

      setShowCreateModal(false)
      setName('')
      setEmail('')
      setPassword('Worker123!')
      setShowPassword(false)
      loadData()
    } catch (err) {
      setModalError(err.message || 'Failed to register worker.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (workerId, currentStatus) => {
    const nextStatus = currentStatus === 'AVAILABLE' ? 'BUSY' : currentStatus === 'BUSY' ? 'OFFLINE' : 'AVAILABLE'
    try {
      await workerService.toggleWorkerDuty(workerId, nextStatus)
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to update duty status.')
    }
  }

  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (statusFilter !== 'ALL' && w.status !== statusFilter) {
        return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = w.name?.toLowerCase().includes(q)
        const matchEmail = w.email?.toLowerCase().includes(q)
        const matchPhone = w.phone?.toLowerCase().includes(q)
        const matchSkills = w.skills?.some((s) => s.toLowerCase().includes(q))
        if (!matchName && !matchEmail && !matchPhone && !matchSkills) return false
      }
      return true
    })
  }, [workers, search, statusFilter])

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
    <div className="cf-authority-workers-page">
      {/* 1. Page Header */}
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">
            {authUser?.department ? `${authUser.department} · Field Crew` : 'Department Field Technicians'}
          </h1>
          <p className="cf-page-subtitle">
            {authUser?.department ? `Manage dedicated field technicians registered under ${authUser.department}.` : `Manage your department's field crew, register new repair technicians, track real-time workloads, and dispatch tasks.`}
          </p>
        </div>

        <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)' }}>
          <Button onClick={() => setShowCreateModal(true)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> Register Field Worker
          </Button>
          <div className="cf-inline-wrap" style={{ gap: '4px' }}>
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
      </div>

      {/* Created Worker Credentials Notification */}
      {createdSuccess && (
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <strong style={{ color: '#15803d', display: 'block', fontSize: '1rem', marginBottom: '4px' }}>
              ✓ Field Worker Registered Successfully!
            </strong>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#166534', lineHeight: 1.5 }}>
              Technician: <strong>{createdSuccess.name}</strong> ({createdSuccess.department})<br />
              Login Email: <code style={{ backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{createdSuccess.email}</code><br />
              Password: <code style={{ backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{createdSuccess.password}</code>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreatedSuccess(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#15803d',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
            title="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Control Bar */}
      <div className="cf-auth-control-bar">
        <div className="cf-search-input-wrap">
          <span className="cf-siw-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input
            type="text"
            placeholder="Search workers by name, skills, email, or phone..."
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
            All Crew ({workers.length})
          </button>
          <button
            type="button"
            className={`cf-cat-pill cf-pill-available ${statusFilter === 'AVAILABLE' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('AVAILABLE')}
          >
            <span className="cf-pill-dot cf-pill-dot--green" />
            Available Only
          </button>
          <button
            type="button"
            className={`cf-cat-pill cf-pill-busy ${statusFilter === 'BUSY' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('BUSY')}
          >
            <span className="cf-pill-dot cf-pill-dot--amber" />
            Busy On Tasks
          </button>
          <button
            type="button"
            className={`cf-cat-pill cf-pill-offline ${statusFilter === 'OFFLINE' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('OFFLINE')}
          >
            <span className="cf-pill-dot cf-pill-dot--gray" />
            Off Duty
          </button>
        </div>
      </div>

      {/* 3. Workers Content */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner />
        </div>
      ) : filteredWorkers.length === 0 ? (
        <EmptyState
          title="No Technicians Found"
          description={search ? 'No workers match your search query.' : 'No field technicians registered under your department.'}
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              ➕ Register First Worker
            </Button>
          }
        />
      ) : viewMode === 'CARDS' ? (
        <div className="cf-workers-master-grid">
          {filteredWorkers.map((worker) => {
            const activeAssigned = complaints.filter(
              (c) => c.assignedWorker?.id === worker.id && c.status !== 'CLOSED' && c.status !== 'RESOLVED'
            )
            const completed = complaints.filter(
              (c) => c.assignedWorker?.id === worker.id && (c.status === 'RESOLVED' || c.status === 'CLOSED')
            )

            const dutyVariant = worker.status === 'AVAILABLE' ? 'success' : worker.status === 'BUSY' ? 'warning' : 'neutral'

            return (
              <div key={worker.id} className="cf-worker-master-card">
                <div className="cf-wmc-top">
                  <div className="cf-wmc-identity">
                    <div className="cf-wmc-avatar">
                      {worker.avatar ? (
                        <img src={worker.avatar} alt={worker.name} />
                      ) : (
                        <span className="cf-wmc-avatar-initials">
                          {worker.name?.charAt(0) || 'W'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="cf-wmc-name">{worker.name}</h3>
                      <span className="cf-wmc-dept">{worker.department || authUser?.department}</span>
                    </div>
                  </div>
                  <Badge variant={dutyVariant}>
                    ● {worker.status || 'AVAILABLE'}
                  </Badge>
                </div>

                <div className="cf-wmc-details-grid">
                  <div className="cf-wmc-cell">
                    <span className="label">Contact Phone</span>
                    <span className="val">{worker.phone || '+91 98765 43210'}</span>
                  </div>
                  <div className="cf-wmc-cell">
                    <span className="label">Current Workload</span>
                    <span className="val highlight">{activeAssigned.length} Active Tasks</span>
                  </div>
                  <div className="cf-wmc-cell">
                    <span className="label">Completed Fixes</span>
                    <span className="val success">{completed.length || worker.completedTasks || 0} Resolved</span>
                  </div>
                  <div className="cf-wmc-cell">
                    <span className="label">Citizen Rating</span>
                    <span className="val">{worker.rating || '5.0'} / 5.0</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-600)' }}>
                  <strong>Specialized Skills:</strong> {worker.skills?.join(', ') || 'General Repair'}
                </div>

                <div className="cf-wmc-footer">
                  <span className="cf-wmc-email">{worker.email}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleToggleStatus(worker.id, worker.status)}
                  >
                    Change Duty Status
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
                <th>Technician Name</th>
                <th>Skills</th>
                <th>Contact</th>
                <th>Active Tasks</th>
                <th>Completed Fixes</th>
                <th>Rating</th>
                <th>Duty Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.map((worker) => {
                const activeAssigned = complaints.filter(
                  (c) => c.assignedWorker?.id === worker.id && c.status !== 'CLOSED' && c.status !== 'RESOLVED'
                )
                const completed = complaints.filter(
                  (c) => c.assignedWorker?.id === worker.id && (c.status === 'RESOLVED' || c.status === 'CLOSED')
                )
                const dutyVariant = worker.status === 'AVAILABLE' ? 'success' : worker.status === 'BUSY' ? 'warning' : 'neutral'

                return (
                  <tr key={worker.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-neutral-950)' }}>{worker.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>{worker.email}</div>
                    </td>
                    <td>
                      <span className="cf-cct-tag">{worker.skills?.join(', ') || 'General'}</span>
                    </td>
                    <td>{worker.phone || '+91 98765 43210'}</td>
                    <td>
                      <Badge variant={activeAssigned.length > 0 ? 'warning' : 'neutral'}>
                        {activeAssigned.length} Active
                      </Badge>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#166534' }}>
                        ✓ {completed.length || worker.completedTasks || 0}
                      </span>
                    </td>
                    <td>{worker.rating || '5.0'}</td>
                    <td>
                      <Badge variant={dutyVariant}>
                        {worker.status || 'AVAILABLE'}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleToggleStatus(worker.id, worker.status)}
                      >
                        Cycle Status
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Register Worker Modal */}
      {showCreateModal && (
        <div className="cf-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="cf-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cf-mc-header">
              <div>
                <span className="cf-mc-badge">Department Onboarding</span>
                <h3 className="cf-mc-title">Register Department Field Worker</h3>
                <p className="cf-mc-desc">
                  Add a new technician to your department team. They will receive credentials to accept and complete assigned field repairs.
                </p>
              </div>
              <button
                type="button"
                className="cf-mc-close"
                onClick={() => setShowCreateModal(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {modalError && (
              <div className="cf-modal-error-box">
                {modalError}
              </div>
            )}

            <form onSubmit={handleRegisterWorker} className="cf-mc-form">
              <div className="cf-form-group">
                <label className="cf-form-label">Department Division</label>
                <input
                  type="text"
                  value={authUser?.department || 'Municipal Operations & Infrastructure'}
                  disabled
                  className="cf-form-input"
                  style={{ background: '#f1f5f9' }}
                />
              </div>

              <div className="cf-form-group">
                <label className="cf-form-label">Technician Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="cf-form-input"
                  required
                />
              </div>

              <div className="cf-form-group">
                <label className="cf-form-label">Official Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. ramesh.patel@civicfix.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="cf-form-input"
                  required
                />
              </div>

              <div className="cf-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                  <label className="cf-form-label" style={{ margin: 0 }}>Account Password *</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary-600)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    {showPassword ? 'Hide Password' : 'Show Password'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="e.g. Worker123!"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cf-form-input"
                  required
                  minLength={6}
                />
                <span className="cf-form-help">
                  Minimum 6 characters. Default is <code>Worker123!</code>. You can keep this or type a custom password for the technician.
                </span>
              </div>

              <div className="cf-form-group">
                <label className="cf-form-label">Contact Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="cf-form-input"
                />
              </div>

              <div className="cf-form-group">
                <label className="cf-form-label">Technical Skills (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Street Lighting, Fuse Replacement, Grid Wiring"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="cf-form-input"
                />
              </div>

              <div className="cf-mc-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  Register Technician
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
