import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Badge } from '../ui/Badge.jsx'
import { CivicFixLogo } from '../ui/CivicFixLogo.jsx'

function getRoleBadgeVariant(role) {
  switch (role) {
    case 'ADMIN':
      return 'danger'
    case 'AUTHORITY':
      return 'primary'
    case 'WORKER':
      return 'warning'
    case 'CITIZEN':
    default:
      return 'neutral'
  }
}

/**
 * MobileNavigation Component
 * Drawer navigation overlay for mobile viewports.
 */
export function MobileNavigation({
  isOpen = false,
  role = 'CITIZEN',
  navItems = [],
  onClose,
  onLogout,
}) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="cf-mobile-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cf-mobile-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cf-sidebar-header">
          <div className="cf-sidebar-brand">
            <CivicFixLogo className="cf-sidebar-brand-img" />
            <span className="cf-sidebar-brand-text">CivicFix</span>
          </div>
          <div className="cf-inline-wrap">
            <Badge variant={getRoleBadgeVariant(role)}>{role}</Badge>
            <button
              type="button"
              className="link-button"
              onClick={onClose}
              aria-label="Close mobile navigation"
              style={{ fontSize: '1.25rem', padding: 'var(--space-1)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <nav className="cf-sidebar-nav">
          {navItems.map((item, idx) => {
            if (item.isHeader) {
              return (
                <div key={`m-header-${idx}`} className="cf-sidebar-section-heading">
                  <span>{item.header}</span>
                </div>
              )
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? 'cf-nav-item is-active' : 'cf-nav-item')}
                onClick={onClose}
                end={item.end ?? false}
              >
                {item.icon && (
                  <span className="cf-nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span className="cf-nav-label">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="cf-nav-badge">{item.badge}</span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="cf-sidebar-footer">
          <button
            type="button"
            className="cf-nav-item"
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger-600)' }}
            onClick={() => {
              if (onClose) onClose()
              if (onLogout) onLogout()
            }}
          >
            <span className="cf-nav-label">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
