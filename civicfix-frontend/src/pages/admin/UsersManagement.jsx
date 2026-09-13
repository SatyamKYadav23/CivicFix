import { useState, useEffect, useMemo, useCallback } from 'react'
import { userService } from '../../services/userService.js'
import { UserTable } from '../../components/user/index.js'
import { Input } from '../../components/ui/Input.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Avatar } from '../../components/ui/Avatar.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { ErrorState } from '../../components/ui/ErrorState.jsx'
import { Toast } from '../../components/ui/Toast.jsx'
import { formatDate } from '../../utils/formatters.js'

export function UsersManagement() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Selected User Modal & Toast
  const [selectedUser, setSelectedUser] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  const loadUsers = useCallback(() => {
    setIsLoading(true)
    setError(null)
    userService
      .getUsers()
      .then((data) => {
        setUsers(data)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load user directory.')
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (search) {
        const q = search.toLowerCase()
        const matchName = u.name.toLowerCase().includes(q)
        const matchEmail = u.email.toLowerCase().includes(q)
        const matchPhone = u.phone && u.phone.toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchPhone) return false
      }
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false
      if (statusFilter !== 'ALL' && (u.status || 'ACTIVE') !== statusFilter) return false
      return true
    })
  }, [users, search, roleFilter, statusFilter])

  const handleToggleStatus = async (user) => {
    try {
      const updated = await userService.toggleUserStatus(user.id)
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)))
      setToastMessage(`Account for ${user.name} is now ${updated.status}.`)
    } catch (err) {
      alert(err.message || 'Failed to update account status.')
    }
  }

  const handleResetFilters = () => {
    setSearch('')
    setRoleFilter('ALL')
    setStatusFilter('ALL')
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load user accounts"
        description={error}
        onRetry={loadUsers}
      />
    )
  }

  return (
    <div>
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">User Account Directory</h1>
          <p className="cf-page-subtitle">
            Search users, filter by organizational role, inspect details, and activate/deactivate accounts.
          </p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: 'var(--space-3)', alignItems: 'flex-end', marginBottom: 'var(--space-6)' }}>
        <Input
          id="user-search"
          label="Search Users"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select
          id="role-filter"
          label="Filter by Role"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          options={[
            { value: 'ALL', label: '👥 All Roles' },
            { value: 'CITIZEN', label: '👤 Citizens' },
            { value: 'AUTHORITY', label: '🛡️ Authority Officers' },
            { value: 'WORKER', label: '👷 Field Workers' },
            { value: 'ADMIN', label: '⚡ Super Administrators' },
          ]}
        />

        <Select
          id="status-filter"
          label="Account Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'ALL', label: 'All Statuses' },
            { value: 'ACTIVE', label: '🟢 Active Only' },
            { value: 'INACTIVE', label: '🔴 Inactive Only' },
          ]}
        />

        <Button variant="secondary" onClick={handleResetFilters}>
          Reset
        </Button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner />
        </div>
      ) : filteredUsers.length > 0 ? (
        <UserTable
          users={filteredUsers}
          onView={(u) => setSelectedUser(u)}
          onToggleStatus={handleToggleStatus}
        />
      ) : (
        <EmptyState
          title="No users match your criteria"
          description="Try modifying or resetting your search keywords and role filters."
          action={
            <Button variant="secondary" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          }
        />
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <Modal
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          title="User Account Details"
          footer={
            <div className="cf-inline-wrap" style={{ justifyContent: 'space-between', width: '100%' }}>
              <Button
                variant={selectedUser.status === 'ACTIVE' ? 'destructive' : 'success'}
                onClick={() => {
                  handleToggleStatus(selectedUser)
                  setSelectedUser(null)
                }}
              >
                {selectedUser.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
              </Button>
              <Button variant="secondary" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Avatar name={selectedUser.name} size="lg" />
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{selectedUser.name}</h3>
                <p style={{ color: 'var(--color-neutral-600)', margin: '2px 0 0' }}>{selectedUser.email}</p>
                <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                  <Badge variant={selectedUser.role === 'ADMIN' ? 'danger' : selectedUser.role === 'AUTHORITY' ? 'primary' : selectedUser.role === 'WORKER' ? 'warning' : 'neutral'}>
                    {selectedUser.role}
                  </Badge>
                  <Badge variant={selectedUser.status === 'ACTIVE' ? 'success' : 'danger'}>
                    {selectedUser.status || 'ACTIVE'}
                  </Badge>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-2)', backgroundColor: 'var(--color-neutral-50)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <div><strong>User ID:</strong> {selectedUser.id}</div>
              <div><strong>Contact Mobile:</strong> {selectedUser.phone || 'Not provided'}</div>
              {selectedUser.department && <div><strong>Department / Division:</strong> {selectedUser.department}</div>}
              {selectedUser.zone && <div><strong>Jurisdiction Zone:</strong> {selectedUser.zone}</div>}
              {selectedUser.address && <div><strong>Primary Address:</strong> {selectedUser.address}</div>}
              {selectedUser.createdAt && <div><strong>Account Created:</strong> {formatDate(selectedUser.createdAt)}</div>}
            </div>
          </div>
        </Modal>
      )}

      {toastMessage && (
        <Toast
          variant="success"
          title="Account Status Updated"
          message={toastMessage}
          onClose={() => setToastMessage('')}
        />
      )}
    </div>
  )
}
