import { useState, useEffect, useMemo, useCallback } from 'react'
import { userService } from '../../services/userService.js'
import { complaintService } from '../../services/complaintService.js'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { ErrorState } from '../../components/ui/ErrorState.jsx'
import { formatDate } from '../../utils/formatters.js'

export function AuthoritiesManagement() {
  const [authorities, setAuthorities] = useState([])
  const [workers, setWorkers] = useState([])
  const [complaints, setComplaints] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('ALL')
  const [viewMode, setViewMode] = useState('CARDS') // 'CARDS' | 'TABLE'

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('Authority123!')
  const [showPassword, setShowPassword] = useState(false)
  const [department, setDepartment] = useState('Roads & Infrastructure')
  const [zone, setZone] = useState('North Ward')
  const [phone, setPhone] = useState('+91 98765 00000')
  const [designation, setDesignation] = useState('Zonal Chief Engineer')
  const [modalError, setModalError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdSuccess, setCreatedSuccess] = useState(null)

  const loadData = useCallback(() => {
    setIsLoading(true)
    setError(null)
    Promise.all([
      userService.getAuthorities(),
      userService.getWorkers(),
      complaintService.getComplaints(),
    ])
      .then(([authData, workerData, complaintData]) => {
        setAuthorities(authData)
        setWorkers(workerData)
        setComplaints(complaintData)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load authorities.')
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setModalError('')
    setIsSubmitting(true)

    const finalPassword = password.trim() || 'Authority123!'

    try {
      await userService.createAuthority(
        {
          name: name.trim(),
          email: email.trim(),
          password: finalPassword,
          department,
          zone: zone.trim(),
          phone: phone.trim(),
          designation: designation.trim() || `${department} Officer`,
        },
        { name: 'System Super-Admin', role: 'ADMIN' }
      )

      setCreatedSuccess({
        name: name.trim(),
        email: email.trim(),
        password: finalPassword,
        department,
      })

      setShowModal(false)
      setName('')
      setEmail('')
      setPassword('Authority123!')
      setShowPassword(false)
      loadData()
    } catch (err) {
      setModalError(err.message || 'Failed to create authority.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (authId) => {
    try {
      await userService.toggleUserStatus(authId, { name: 'System Super-Admin', role: 'ADMIN' })
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to update status.')
    }
  }

  const handleDeleteAuthority = async (authId, authName) => {
    if (window.confirm(`Are you sure you want to remove authority account "${authName}"?`)) {
      try {
        await userService.deleteUser(authId, { name: 'System Super-Admin', role: 'ADMIN' })
        loadData()
      } catch (err) {
        alert(err.message || 'Failed to delete authority.')
      }
    }
  }

  const departmentsList = useMemo(() => {
    const depts = new Set(['Roads & Infrastructure', 'Water Supply & Leakage', 'Electrical Division & Lights', 'Sanitation & Solid Waste'])
    authorities.forEach((a) => {
      if (a.department) depts.add(a.department)
    })
    return Array.from(depts)
  }, [authorities])

  const filteredAuthorities = useMemo(() => {
    return authorities.filter((a) => {
      if (selectedDept !== 'ALL' && a.department !== selectedDept) {
        return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = a.name?.toLowerCase().includes(q)
        const matchEmail = a.email?.toLowerCase().includes(q)
        const matchDept = a.department?.toLowerCase().includes(q)
        const matchZone = a.zone?.toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchDept && !matchZone) return false
      }
      return true
    })
  }, [authorities, search, selectedDept])

  if (error) {
    return (
      <ErrorState
        title="Failed to load officers"
        description={error}
        onRetry={loadData}
      />
    )
  }

  return (
    <div className="cf-authorities-page">
      {/* 1. Header with Create Action */}
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Municipal Authority Officers</h1>
          <p className="cf-page-subtitle">
            Admin creates and assigns Department Authority Officers. Each officer leads a municipal division and manages their dedicated field workers.
          </p>
        </div>

        <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)' }}>
          <Button onClick={() => setShowModal(true)}>
            + Create New Authority
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

      {/* Created Authority Credentials Notification */}
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
              ✓ Department Authority Created Successfully!
            </strong>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#166534', lineHeight: 1.5 }}>
              Officer: <strong>{createdSuccess.name}</strong> ({createdSuccess.department})<br />
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

      {/* 2. Filter & Search Bar */}
      <div className="cf-auth-control-bar">
        <div className="cf-search-input-wrap">
          <span className="cf-siw-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input
            type="text"
            placeholder="Search officers by name, email, department, or zone..."
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
            All Divisions ({authorities.length})
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
      ) : filteredAuthorities.length === 0 ? (
        <EmptyState
          title="No Authority Officers Found"
          description={search || selectedDept !== 'ALL' ? 'No officers match your search or department filter.' : 'No authorities have been appointed yet.'}
          action={
            <Button onClick={() => setShowModal(true)}>
              + Create First Authority
            </Button>
          }
        />
      ) : viewMode === 'CARDS' ? (
        <div className="cf-authorities-grid">
          {filteredAuthorities.map((auth) => {
            const assignedWorkers = workers.filter(
              (w) => w.department === auth.department || w.managingAuthorityId === auth.id
            )
            const deptComplaints = complaints.filter(
              (c) => c.category?.toLowerCase().includes(auth.department?.toLowerCase().split(' ')[0] || '')
            )
            const isActive = auth.status !== 'INACTIVE'

            return (
              <div key={auth.id} className="cf-authority-master-card">
                <div className="cf-amc-header">
                  <div className="cf-amc-identity">
                    <div className="cf-amc-avatar">
                      {auth.avatar ? (
                        <img src={auth.avatar} alt={auth.name} />
                      ) : (
                        <span className="cf-wmc-avatar-initials">
                          {auth.name?.charAt(0) || 'A'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="cf-amc-name">{auth.name}</h3>
                      <span className="cf-amc-designation">{auth.designation || 'Zonal Officer'}</span>
                    </div>
                  </div>
                  <Badge variant={isActive ? 'success' : 'neutral'}>
                    {isActive ? '● ACTIVE' : '○ INACTIVE'}
                  </Badge>
                </div>

                <div className="cf-amc-dept-tag">
                  <strong>{auth.department}</strong>
                </div>

                <div className="cf-amc-details-grid">
                  <div className="cf-amc-detail-item">
                    <span className="label">Jurisdiction Zone</span>
                    <span className="val">{auth.zone || 'Central Ward'}</span>
                  </div>
                  <div className="cf-amc-detail-item">
                    <span className="label">Official Email</span>
                    <span className="val">{auth.email}</span>
                  </div>
                  <div className="cf-amc-detail-item">
                    <span className="label">Managed Workers</span>
                    <span className="val highlight">{assignedWorkers.length} Field Crew</span>
                  </div>
                  <div className="cf-amc-detail-item">
                    <span className="label">Department Grievances</span>
                    <span className="val">{deptComplaints.length} Cases Logged</span>
                  </div>
                </div>

                <div className="cf-amc-footer">
                  <span className="cf-amc-date">Appointed {formatDate(auth.createdAt)}</span>

                  <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)' }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleToggleStatus(auth.id)}
                    >
                      {isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <button
                      type="button"
                      className="link-button"
                      style={{ color: 'var(--color-danger-600)', fontSize: '0.75rem', padding: 'var(--space-1)' }}
                      onClick={() => handleDeleteAuthority(auth.id, auth.name)}
                    >
                      Remove
                    </button>
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
                <th>Officer / Designation</th>
                <th>Department</th>
                <th>Zone</th>
                <th>Email / Contact</th>
                <th>Managed Workers</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuthorities.map((auth) => {
                const assignedWorkers = workers.filter(
                  (w) => w.department === auth.department || w.managingAuthorityId === auth.id
                )
                const isActive = auth.status !== 'INACTIVE'

                return (
                  <tr key={auth.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-neutral-950)' }}>{auth.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>{auth.designation || 'Zonal Officer'}</div>
                    </td>
                    <td>
                      <span className="cf-cct-tag">{auth.department}</span>
                    </td>
                    <td>{auth.zone || 'Central Ward'}</td>
                    <td>
                      <div>{auth.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>{auth.phone}</div>
                    </td>
                    <td>
                      <Badge variant="primary">{assignedWorkers.length} Workers</Badge>
                    </td>
                    <td>
                      <Badge variant={isActive ? 'success' : 'neutral'}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </td>
                    <td>
                      <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)' }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleToggleStatus(auth.id)}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <button
                          type="button"
                          className="link-button"
                          style={{ color: 'var(--color-danger-600)', fontSize: '0.75rem' }}
                          onClick={() => handleDeleteAuthority(auth.id, auth.name)}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Create Authority Modal */}
      {showModal && (
        <div className="cf-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="cf-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cf-mc-header">
              <div>
                <span className="cf-mc-badge">Authority Creation</span>
                <h3 className="cf-mc-title">Create Department Authority Officer</h3>
                <p className="cf-mc-desc">
                  Assign a nodal officer to lead a municipal division. This officer will triage grievances and manage department technicians.
                </p>
              </div>
              <button
                type="button"
                className="cf-mc-close"
                onClick={() => setShowModal(false)}
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

            <form onSubmit={handleCreateSubmit} className="cf-mc-form">
              <div className="cf-form-group">
                <label className="cf-form-label">Select Municipal Department *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="cf-form-input"
                  required
                >
                  <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                  <option value="Water Supply & Leakage">Water Supply & Leakage</option>
                  <option value="Electrical Division & Lights">Electrical Division & Lights</option>
                  <option value="Sanitation & Solid Waste">Sanitation & Solid Waste</option>
                  <option value="Drainage & Stormwater">Drainage & Stormwater</option>
                  <option value="Horticulture & Public Parks">Horticulture & Public Parks</option>
                </select>
              </div>

              <div className="cf-form-group">
                <label className="cf-form-label">Officer Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ankit Verma / Dr. Rajesh Khanna"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="cf-form-input"
                  required
                />
              </div>

              <div className="cf-form-group">
                <label className="cf-form-label">Official Government Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. ankit.verma@civicfix.gov.in"
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
                  placeholder="e.g. Authority123!"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cf-form-input"
                  required
                  minLength={6}
                />
                <span className="cf-form-help">
                  Minimum 6 characters. Default is <code>Authority123!</code>. You can keep this or type a custom password for the officer.
                </span>
              </div>

              <div className="cf-grid-2">
                <div className="cf-form-group">
                  <label className="cf-form-label">Jurisdictional Zone / Ward *</label>
                  <input
                    type="text"
                    placeholder="e.g. North Zone / Ward 14"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="cf-form-input"
                    required
                  />
                </div>

                <div className="cf-form-group">
                  <label className="cf-form-label">Official Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="cf-form-input"
                  />
                </div>
              </div>

              <div className="cf-form-group">
                <label className="cf-form-label">Official Designation Title</label>
                <input
                  type="text"
                  placeholder="e.g. Zonal Executive Engineer / Chief Health Officer"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="cf-form-input"
                />
              </div>

              <div className="cf-mc-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  Appoint & Create Authority
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
