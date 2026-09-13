import { useState, useEffect, useMemo, useCallback } from 'react'
import { userService } from '../../services/userService.js'
import { complaintService } from '../../services/complaintService.js'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { ErrorState } from '../../components/ui/ErrorState.jsx'
import { formatDate } from '../../utils/formatters.js'

export function CitizensManagement() {
  const [citizens, setCitizens] = useState([])
  const [complaints, setComplaints] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('CARDS') // 'CARDS' | 'TABLE'

  const loadData = useCallback(() => {
    setIsLoading(true)
    setError(null)
    Promise.all([
      userService.getCitizens(),
      complaintService.getComplaints(),
    ])
      .then(([citizensData, complaintsData]) => {
        setCitizens(citizensData)
        setComplaints(complaintsData)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load citizens roster.')
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleToggleStatus = async (citizenId) => {
    try {
      await userService.toggleUserStatus(citizenId, { name: 'System Super-Admin', role: 'ADMIN' })
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to update citizen status.')
    }
  }

  const filteredCitizens = useMemo(() => {
    return citizens.filter((c) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = c.name?.toLowerCase().includes(q)
        const matchEmail = c.email?.toLowerCase().includes(q)
        const matchAddress = c.address?.toLowerCase().includes(q)
        const matchPhone = c.phone?.toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchAddress && !matchPhone) return false
      }
      return true
    })
  }, [citizens, search])

  if (error) {
    return (
      <ErrorState
        title="Failed to load citizens"
        description={error}
        onRetry={loadData}
      />
    )
  }

  return (
    <div className="cf-admin-citizens-page">
      {/* 1. Header */}
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Registered Citizens Directory</h1>
          <p className="cf-page-subtitle">
            All registered citizens, grievance reporters, and public users across municipal wards.
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
            placeholder="Search citizens by name, email, phone, or registered address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cf-search-input"
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner />
        </div>
      ) : filteredCitizens.length === 0 ? (
        <EmptyState
          title="No Citizens Found"
          description={search ? 'No registered citizens match your search.' : 'No citizens registered in the platform.'}
        />
      ) : viewMode === 'CARDS' ? (
        <div className="cf-citizens-master-grid">
          {filteredCitizens.map((cit) => {
            const userComplaints = complaints.filter(
              (c) => c.citizenId === cit.id || c.citizenName?.toLowerCase() === cit.name?.toLowerCase()
            )
            const resolvedCount = userComplaints.filter(
              (c) => c.status === 'RESOLVED' || c.status === 'CLOSED'
            ).length
            const isActive = cit.status !== 'INACTIVE'

            return (
              <div key={cit.id} className="cf-citizen-master-card">
                <div className="cf-cmc-top">
                  <div className="cf-cmc-identity">
                    <div className="cf-cmc-avatar">
                      {cit.avatar ? (
                        <img src={cit.avatar} alt={cit.name} />
                      ) : (
                        <span>{cit.name ? cit.name.charAt(0).toUpperCase() : 'C'}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="cf-cmc-name">{cit.name}</h3>
                      <span className="cf-cmc-email">{cit.email}</span>
                    </div>
                  </div>
                  <Badge variant={isActive ? 'success' : 'danger'}>
                    {isActive ? 'ACTIVE' : 'SUSPENDED'}
                  </Badge>
                </div>

                <div className="cf-cmc-details-grid">
                  <div className="cf-cmc-cell">
                    <span className="label">Registered Address</span>
                    <span className="val">{cit.address || 'New Delhi Area'}</span>
                  </div>
                  <div className="cf-cmc-cell">
                    <span className="label">Contact Phone</span>
                    <span className="val">{cit.phone || '+91 98765 11111'}</span>
                  </div>
                  <div className="cf-cmc-cell">
                    <span className="label">Total Complaints Reported</span>
                    <span className="val highlight">{userComplaints.length} Filed</span>
                  </div>
                  <div className="cf-cmc-cell">
                    <span className="label">Resolved & Rated</span>
                    <span className="val success">{resolvedCount} Completed</span>
                  </div>
                </div>

                <div className="cf-cmc-footer">
                  <span className="cf-cmc-date">Joined {formatDate(cit.createdAt)}</span>
                  <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)' }}>
                    <Button
                      size="sm"
                      variant={isActive ? 'secondary' : 'primary'}
                      onClick={() => handleToggleStatus(cit.id)}
                    >
                      {isActive ? 'Suspend' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteCitizen(cit.id, cit.name)}
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
                <th>Citizen Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Complaints Filed</th>
                <th>Account Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCitizens.map((cit) => {
                const userComplaints = complaints.filter(
                  (c) => c.citizenId === cit.id || c.citizenName?.toLowerCase() === cit.name?.toLowerCase()
                )
                const isActive = cit.status !== 'INACTIVE'

                return (
                  <tr key={cit.id}>
                    <td>
                      <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)' }}>
                        <div className="cf-cmc-avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                          <span>{cit.name ? cit.name.charAt(0).toUpperCase() : 'C'}</span>
                        </div>
                        <strong>{cit.name}</strong>
                      </div>
                    </td>
                    <td>{cit.email}</td>
                    <td>{cit.phone || '—'}</td>
                    <td>{cit.address || '—'}</td>
                    <td>
                      <span className="cf-badge cf-badge-neutral">{userComplaints.length} filed</span>
                    </td>
                    <td>
                      <Badge variant={isActive ? 'success' : 'danger'}>
                        {isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </Badge>
                    </td>
                    <td>
                      <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)' }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleToggleStatus(cit.id)}
                        >
                          {isActive ? 'Suspend' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteCitizen(cit.id, cit.name)}
                        >
                          Remove
                        </Button>
                      </div>
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
