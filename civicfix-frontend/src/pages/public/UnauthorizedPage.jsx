import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { Button } from '../../components/ui/Button.jsx'

export function UnauthorizedPage() {
  const { user, role, logout } = useAuth()
  const location = useLocation()

  const userRole = user?.role || role || 'CITIZEN'
  const attemptedRole = location.state?.attemptedRole

  const roleDashboard = {
    CITIZEN: '/citizen/dashboard',
    AUTHORITY: '/authority/dashboard',
    WORKER: '/worker/dashboard',
    ADMIN: '/admin/dashboard',
  }[userRole] || '/'

  return (
    <section className="state-page">
      <div className="container state-card">
        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>🚫</div>
        <h1>Access Denied (403)</h1>
        <p style={{ marginTop: 'var(--space-2)' }}>
          You do not have permission to view {attemptedRole ? `the ${attemptedRole} portal` : 'this page'}.
        </p>
        <p style={{ marginTop: 'var(--space-1)', color: 'var(--color-neutral-600)' }}>
          Currently logged in as: <strong>{user?.name || 'User'}</strong> ({userRole})
        </p>

        <div className="state-actions" style={{ marginTop: 'var(--space-5)' }}>
          <Link to={roleDashboard}>
            <Button>Go to My {userRole} Dashboard</Button>
          </Link>
          <Button variant="secondary" onClick={logout}>
            Sign Out & Switch Account
          </Button>
          <Link to="/">
            <Button variant="ghost">Public Home</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
