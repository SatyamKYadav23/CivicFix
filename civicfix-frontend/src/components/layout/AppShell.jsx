import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { Sidebar } from './Sidebar.jsx'
import { Topbar } from './Topbar.jsx'
import { MobileNavigation } from './MobileNavigation.jsx'

/**
 * AppShell Component
 * Core authenticated application shell uniting desktop sidebar, mobile drawer, topbar, and main router outlet.
 */
export function AppShell({
  role,
  user: propUser,
  navItems = [],
  onLogout: propLogout,
  className = '',
}) {
  const { user: authUser, role: authRole, logout: authLogout } = useAuth()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const effectiveRole = role || authRole || 'CITIZEN'
  const effectiveUser = propUser || authUser || { name: 'User', email: 'user@civicfix.gov.in', role: effectiveRole }

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => !prev)
  }

  const handleLogout = () => {
    if (propLogout) {
      propLogout()
    } else {
      authLogout()
      navigate('/login')
    }
  }

  return (
    <div className={`cf-app-shell ${isCollapsed ? 'is-collapsed' : ''} ${className}`.trim()}>
      <Sidebar
        role={effectiveRole}
        navItems={navItems}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onLogout={handleLogout}
      />

      <MobileNavigation
        isOpen={mobileNavOpen}
        role={effectiveRole}
        navItems={navItems}
        onClose={() => setMobileNavOpen(false)}
        onLogout={handleLogout}
      />

      <div className="cf-shell-main">
        <Topbar
          role={effectiveRole}
          user={effectiveUser}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onLogout={handleLogout}
        />

        <main className="cf-shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
