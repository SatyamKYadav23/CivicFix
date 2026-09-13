import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'

export function RequireRole({ requiredRole, children }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Verifying access credentials...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" state={{ attemptedRole: requiredRole, userRole: user?.role }} replace />
  }

  return children
}

