import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { userService } from '../../services/userService.js'
import { complaintService } from '../../services/complaintService.js'
import { adminService } from '../../services/adminService.js'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { ComplaintStatus, ComplaintPriority } from '../../components/complaint/index.js'
import { formatRelativeTime } from '../../utils/formatters.js'
import { COMPLAINT_STATUSES, USER_ROLES } from '../../utils/constants.js'

export function AdminDashboard() {
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [complaints, setComplaints] = useState([])
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [complaintSearch, setComplaintSearch] = useState('')
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL')

  const loadData = () => {
    setIsLoading(true)
    Promise.all([
      userService.getUsers(),
      complaintService.getComplaints(),
      adminService.getAuditLogs().catch(() => []),
    ]).then(([usersData, complaintsData, auditData]) => {
      setUsers(Array.isArray(usersData) ? usersData : (usersData?.users || []))
      setComplaints(Array.isArray(complaintsData) ? complaintsData : (complaintsData?.complaints || []))
      const logItems = Array.isArray(auditData) ? auditData : (auditData?.logs || [])
      setActivities(logItems)
      setIsLoading(false)
    }).catch((err) => {
      console.error('Failed to load admin dashboard data', err)
      setIsLoading(false)
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  // User breakdown
  const citizensCount = users.filter((u) => u.role === USER_ROLES.CITIZEN).length
  const authorities = users.filter((u) => u.role === USER_ROLES.AUTHORITY)
  const authoritiesCount = authorities.length
  const workers = users.filter((u) => u.role === USER_ROLES.WORKER)
  const workersCount = workers.length

  // Complaint breakdown
  const totalComplaintsCount = complaints.length
  const inProgressCount = complaints.filter(
    (c) =>
      c.status === COMPLAINT_STATUSES.REPORTED ||
      c.status === COMPLAINT_STATUSES.SUBMITTED ||
      c.status === COMPLAINT_STATUSES.UNDER_REVIEW ||
      c.status === COMPLAINT_STATUSES.ASSIGNED ||
      c.status === COMPLAINT_STATUSES.IN_PROGRESS
  ).length
  const resolvedCount = complaints.filter(
    (c) => c.status === COMPLAINT_STATUSES.RESOLVED || c.status === COMPLAINT_STATUSES.CLOSED
  ).length

  const resolutionRate = totalComplaintsCount > 0
    ? ((resolvedCount / totalComplaintsCount) * 100).toFixed(0)
    : '100'

  // Filtered complaints mini-stream
  const displayedComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (selectedDeptFilter !== 'ALL') {
        const cat = (c.category || '').toLowerCase()
        if (!cat.includes(selectedDeptFilter.toLowerCase())) return false
      }
      if (complaintSearch.trim()) {
        const q = complaintSearch.toLowerCase()
        const matchTitle = c.title?.toLowerCase().includes(q)
        const matchId = c.id?.toLowerCase().includes(q)
        const matchCitizen = c.citizenName?.toLowerCase().includes(q)
        if (!matchTitle && !matchId && !matchCitizen) return false
      }
      return true
    }).slice(0, 6)
  }, [complaints, selectedDeptFilter, complaintSearch])

  return (
    <div className="cf-admin-dashboard-page">
      {/* 1. Header */}
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">City Civic Governance Center</h1>
          <p className="cf-page-subtitle">
            Global civic oversight across all municipal departments, authority assignments, and citizen dockets.
          </p>
        </div>

        <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)' }}>
          <Link to="/admin/complaints">
            <Button variant="secondary">All Complaints Registry</Button>
          </Link>
          <Link to="/admin/analytics">
            <Button variant="secondary">Platform Analytics</Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner />
        </div>
      ) : (
        <>
          {/* 2. Top 4 Super-Admin Metric Cards */}
          <div className="cf-admin-kpi-grid">
            <div
              className="cf-admin-kpi-card clickable"
              onClick={() => navigate('/admin/complaints')}
            >
              <span className="cf-akc-label">Total Citizen Grievances</span>
              <span className="cf-akc-value">{totalComplaintsCount}</span>
              <div className="cf-sla-bar-track" title={`${resolutionRate}% Resolution SLA Compliance`}>
                <div className="cf-sla-bar-fill" style={{ width: `${resolutionRate}%` }} />
              </div>
              <span className="cf-akc-sub">
                {inProgressCount} Active • {resolvedCount} Resolved ({resolutionRate}% SLA Rate)
              </span>
            </div>

            <div
              className="cf-admin-kpi-card clickable"
              onClick={() => navigate('/admin/authorities')}
            >
              <span className="cf-akc-label">Department Authorities</span>
              <span className="cf-akc-value">{authoritiesCount}</span>
              <span className="cf-akc-sub">
                Active Nodal Officers Across Zones →
              </span>
            </div>

            <div
              className="cf-admin-kpi-card clickable"
              onClick={() => navigate('/admin/workers')}
            >
              <span className="cf-akc-label">Field Workforce</span>
              <span className="cf-akc-value">{workersCount}</span>
              <span className="cf-akc-sub">
                Dispatched Field Technicians on Duty →
              </span>
            </div>

            <div
              className="cf-admin-kpi-card clickable"
              onClick={() => navigate('/admin/citizens')}
            >
              <span className="cf-akc-label">Registered Citizens</span>
              <span className="cf-akc-value">{citizensCount}</span>
              <span className="cf-akc-sub">
                Active Verified Ward Reporters →
              </span>
            </div>
          </div>

          {/* 3. Department Health & Operational Status */}
          <div className="cf-admin-section-box">
            <div className="cf-asb-header">
              <div>
                <h2 className="cf-asb-title">Municipal Departments & Authority Leadership</h2>
                <p className="cf-asb-desc">Overview of active officers, managed field teams, and case workloads by department.</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate('/admin/authorities')}>
                Manage Authorities →
              </Button>
            </div>

            {authorities.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-8) var(--space-4)',
                  backgroundColor: 'var(--color-neutral-50)',
                  border: '1px dashed var(--color-neutral-300)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>🏛️</div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-neutral-900)', margin: '0 0 6px' }}>
                  No Department Authorities Configured Yet
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-500)', maxWidth: '520px', margin: '0 auto var(--space-4)', lineHeight: 1.5 }}>
                  You have not created any department nodal authorities yet. As administrator, you can create authority officers corresponding to specific municipal divisions (e.g. Street Lighting, Water & Sewage, Roads, Sanitation) to assign field crews and triage grievances.
                </p>
                <Button onClick={() => navigate('/admin/authorities')}>
                  + Create Department Authority
                </Button>
              </div>
            ) : (
              <div className="cf-dept-health-grid">
                {authorities.map((auth) => {
                  const deptWorkers = workers.filter(
                    (w) => w.department === auth.department || w.managingAuthorityId === auth.id
                  )
                  const deptIssues = complaints.filter((c) => {
                    const cat = (c.category || '').toLowerCase()
                    const dept = (auth.department || '').toLowerCase()
                    return cat.includes(dept) || dept.includes(cat)
                  }).length

                  return (
                    <div
                      key={auth.id}
                      className="cf-dept-health-card"
                      style={{
                        cursor: 'pointer',
                        borderColor: selectedDeptFilter === auth.department ? 'var(--color-primary-600)' : undefined,
                        background: selectedDeptFilter === auth.department ? '#f8faff' : undefined,
                      }}
                      onClick={() => setSelectedDeptFilter(selectedDeptFilter === auth.department ? 'ALL' : auth.department)}
                      title={`Click to filter complaints by ${auth.department}`}
                    >
                      <div className="cf-dhc-top">
                        <div className="cf-dhc-header-text">
                          <strong>{auth.department || 'Municipal Division'}</strong>
                          <span>Zone: {auth.zone || 'City Jurisdiction'}</span>
                        </div>
                      </div>

                      <div className="cf-dhc-meta">
                        <div className="cf-dhc-cell">
                          <span className="label">Nodal Officer</span>
                          <span className="val">{auth.name || 'Nodal Officer'}</span>
                        </div>
                        <div className="cf-dhc-cell">
                          <span className="label">Assigned Workers</span>
                          <span className="val">{deptWorkers.length} Crew</span>
                        </div>
                        <div className="cf-dhc-cell">
                          <span className="label">Active Workload</span>
                          <span className="val highlight">{deptIssues} Issues</span>
                        </div>
                        <div className="cf-dhc-cell">
                          <span className="label">Status</span>
                          <span className="val success">{auth.status || 'ACTIVE'}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 4. Two-Column Split: Latest Master Complaints + Live Audit Log */}
          <div className="cf-admin-split-grid">
            {/* Left: Master Complaints Stream */}
            <div className="cf-admin-panel-card">
              <div className="cf-apc-header">
                <div>
                  <h3 className="cf-apc-title">City-Wide Master Grievances</h3>
                  <span className="cf-apc-sub">
                    {selectedDeptFilter !== 'ALL' ? `Filtered by department (${displayedComplaints.length})` : 'Recent issues logged across the city'}
                  </span>
                </div>

                <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)' }}>
                  <input
                    type="text"
                    className="cf-input"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: '150px' }}
                    placeholder="Search grievances..."
                    value={complaintSearch}
                    onChange={(e) => setComplaintSearch(e.target.value)}
                  />
                  <Link to="/admin/complaints" className="cf-apc-link">
                    View All ({complaints.length}) →
                  </Link>
                </div>
              </div>

              <div className="cf-admin-complaints-mini-list">
                {displayedComplaints.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-neutral-500)', fontSize: '0.875rem' }}>
                    No complaints match current filter.
                  </div>
                ) : (
                  displayedComplaints.map((c) => (
                    <div
                      key={c.id}
                      className="cf-acm-item"
                      onClick={() => navigate(`/admin/complaints`)}
                    >
                      <div className="cf-acm-top">
                        <span className="cf-acm-id">{c.id}</span>
                        <span className="cf-acm-time">{formatRelativeTime(c.createdAt)}</span>
                      </div>
                      <div className="cf-acm-title">{c.title}</div>
                      <div className="cf-acm-meta">
                        <span>{c.citizenName || c.citizen?.name || 'Citizen'}</span>
                        <span>{typeof c.location === 'object' ? c.location?.address : c.location}</span>
                      </div>
                      <div className="cf-acm-badges">
                        <ComplaintPriority priority={c.priority} />
                        <ComplaintStatus status={c.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Live System Audit Ledger */}
            <div className="cf-admin-panel-card">
              <div className="cf-apc-header">
                <div>
                  <h3 className="cf-apc-title">Live System Audit Trail</h3>
                  <span className="cf-apc-sub">Immutable ledger of authority triage, worker dispatches, and fixes</span>
                </div>
                <Link to="/admin/activity" className="cf-apc-link">
                  Full Ledger →
                </Link>
              </div>

              <div className="cf-audit-mini-stream">
                {activities.slice(0, 6).map((act, index) => (
                  <div key={act.id || index} className="cf-audit-stream-item">
                    <div className="cf-asi-bullet" />
                    <div className="cf-asi-content">
                      <div className="cf-asi-top">
                        <strong className="cf-asi-actor">{act.actor?.name || act.actorName || 'Admin'}</strong>
                        <span className="cf-asi-time">{formatRelativeTime(act.createdAt || act.timestamp)}</span>
                      </div>
                      <p className="cf-asi-action">
                        {act.action} {act.details && `(${act.details})`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
