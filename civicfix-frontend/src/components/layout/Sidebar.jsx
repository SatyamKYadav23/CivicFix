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
 * Sidebar Component
 * Desktop vertical navigation sidebar for authenticated application shells.
 */
export function Sidebar({
  role = 'CITIZEN',
  navItems = [],
  isCollapsed = false,
  onToggleCollapse,
  onLogout,
  className = '',
}) {
  return (
    <aside
      className={`cf-sidebar ${isCollapsed ? 'is-collapsed' : ''} ${className}`.trim()}
      aria-label={`${role} sidebar navigation`}
    >
      <div className="cf-sidebar-header">
        <NavLink
          to={`/${role.toLowerCase()}/dashboard`}
          className="cf-sidebar-brand"
          title="CivicFix Home"
        >
          <CivicFixLogo className="cf-sidebar-brand-img" />
          <span className="cf-sidebar-brand-text">CivicFix</span>
        </NavLink>
        <Badge variant={getRoleBadgeVariant(role)} className="cf-sidebar-role-badge">
          {role}
        </Badge>
        {onToggleCollapse && (
          <button
            type="button"
            className="cf-sidebar-header-toggle"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {isCollapsed ? (
                <polyline points="9 18 15 12 9 6" />
              ) : (
                <polyline points="15 18 9 12 15 6" />
              )}
            </svg>
          </button>
        )}
      </div>

      {!isCollapsed ? (
        <nav className="cf-sidebar-nav">
          {navItems.map((item, idx) => {
            if (item.isHeader) {
              return (
                <div key={`header-${idx}`} className="cf-sidebar-section-heading">
                  <span>{item.header}</span>
                </div>
              )
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? 'cf-nav-item is-active' : 'cf-nav-item')}
                end={item.end ?? false}
                title={item.label}
              >
                <span className="cf-nav-label">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="cf-nav-badge">{item.badge}</span>
                )}
              </NavLink>
            )
          })}
        </nav>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      <div className="cf-sidebar-footer">
        {onToggleCollapse && (
          <button
            type="button"
            className="cf-sidebar-toggle-btn"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {isCollapsed ? (
                <polyline points="9 18 15 12 9 6" />
              ) : (
                <polyline points="15 18 9 12 15 6" />
              )}
            </svg>
            <span className="cf-nav-label">{isCollapsed ? 'Expand' : 'Collapse Menu'}</span>
          </button>
        )}

        <button
          type="button"
          className="cf-sidebar-logout-btn"
          onClick={onLogout}
          title="Log Out"
          aria-label="Log Out"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          <span className="cf-nav-label">Log Out</span>
        </button>
      </div>
    </aside>
  )
}
