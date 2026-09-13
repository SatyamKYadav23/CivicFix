import { NotificationTrigger } from './NotificationTrigger.jsx'
import { ProfileMenu } from './ProfileMenu.jsx'

/**
 * Topbar Component
 * Header navigation bar providing mobile menu toggle, search, notification alerts, and profile menu.
 */
export function Topbar({
  role = 'CITIZEN',
  user,
  title,
  onOpenMobileNav,
  onLogout,
  onSearch,
  className = '',
}) {
  return (
    <header className={`cf-topbar ${className}`.trim()}>
      <div className="cf-topbar-left">
        <button
          type="button"
          className="cf-menu-toggle"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {title ? (
          <h1 className="cf-topbar-title">{title}</h1>
        ) : (
          <div style={{ maxWidth: '320px', width: '100%', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-neutral-400)', display: 'flex', pointerEvents: 'none' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input
              type="search"
              className="cf-input"
              style={{ paddingLeft: '2.2rem', paddingTop: '0.4rem', paddingBottom: '0.4rem', fontSize: '0.875rem' }}
              placeholder="Search complaints or tasks…"
              onChange={(e) => onSearch && onSearch(e.target.value)}
              aria-label="Global search"
            />
          </div>
        )}
      </div>

      <div className="cf-topbar-right">
        <NotificationTrigger />
        <ProfileMenu user={user} role={role} onLogout={onLogout} />
      </div>
    </header>
  )
}

