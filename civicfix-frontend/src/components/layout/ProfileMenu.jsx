import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../ui/Avatar.jsx'
import { Badge } from '../ui/Badge.jsx'

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
 * ProfileMenu Component
 * Accessible user profile popover with profile navigation, settings, and logout.
 */
export function ProfileMenu({
  user = { name: 'User', email: 'user@civicfix.gov.in', role: 'CITIZEN' },
  role = 'CITIZEN',
  onLogout,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const rolePrefix = `/${role.toLowerCase()}`

  return (
    <div className={`cf-profile-menu-wrap ${className}`.trim()} ref={menuRef}>
      <button
        type="button"
        className="cf-profile-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User profile menu"
      >
        <Avatar name={user.name} size="sm" />
        <div style={{ display: 'none', textAlign: 'left' }} className="cf-profile-trigger-label">
          <div className="cf-profile-menu-name">{user.name}</div>
          <div className="cf-profile-menu-role">{role}</div>
        </div>
        <span style={{ display: 'flex', opacity: 0.6 }} aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </button>

      {open && (
        <div className="cf-profile-popover" role="menu">
          <div className="cf-profile-popover-header">
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-neutral-950)' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)' }}>
              {user.email}
            </div>
            <Badge variant={getRoleBadgeVariant(role)}>{role}</Badge>
          </div>

          <Link
            to={`${rolePrefix}/profile`}
            className="cf-profile-popover-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <span>My Profile</span>
          </Link>

          <Link
            to={`${rolePrefix}/settings`}
            className="cf-profile-popover-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <span>Settings</span>
          </Link>

          <div className="cf-profile-popover-divider" />

          <button
            type="button"
            className="cf-profile-popover-item"
            style={{ color: 'var(--color-danger-600)' }}
            role="menuitem"
            onClick={() => {
              setOpen(false)
              if (onLogout) onLogout()
            }}
          >
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}
