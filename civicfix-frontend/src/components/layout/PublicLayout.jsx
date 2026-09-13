import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { CivicFixLogo } from '../ui/CivicFixLogo.jsx'
import { LiveTrackModal } from '../home/LiveTrackModal.jsx'

export function PublicLayout() {
  const { user, isAuthenticated, logout } = useAuth()
  const [trackModalOpen, setTrackModalOpen] = useState(false)

  const roleDashboard = {
    CITIZEN: '/citizen/dashboard',
    AUTHORITY: '/authority/dashboard',
    WORKER: '/worker/dashboard',
    ADMIN: '/admin/dashboard',
  }[user?.role] || '/citizen/dashboard'

  return (
    <div className="app-root">
      <header className="site-header">
        <div className="container site-header-inner">
          <NavLink to="/" className="brand">
            <CivicFixLogo />
            <span>CivicFix</span>
          </NavLink>
          <nav className="site-nav" aria-label="Public navigation">
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
              end
            >
              Home
            </NavLink>

            <a href="/#categories" className="nav-link">
              Services
            </a>

            <a href="/#showcase" className="nav-link">
              Resolutions
            </a>

            <a href="/#how-it-works" className="nav-link">
              How It Works
            </a>

            <button
              type="button"
              className="btn btn-secondary"
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.8125rem',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
              onClick={() => setTrackModalOpen(true)}
            >
              <span>🔎</span>
              <span>Track Docket</span>
            </button>

            {isAuthenticated ? (
              <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)' }}>
                <Link
                  to={roleDashboard}
                  className="btn btn-primary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}
                >
                  {user?.role} Portal
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="btn btn-ghost"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
                >
                  Sign in
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
                >
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <LiveTrackModal
        isOpen={trackModalOpen}
        onClose={() => setTrackModalOpen(false)}
      />

      <main>
        <Outlet />
      </main>

      <footer className="cf-footer-rich">
        <div className="container">
          <div className="cf-footer-grid">
            <div>
              <Link to="/" className="cf-footer-brand">
                <CivicFixLogo />
                <span>CivicFix</span>
              </Link>
              <p className="cf-footer-tagline">
                Smart Municipal Complaint Resolution & Urban Governance System.
                Connecting citizens with public authorities and field response teams for fast, transparent civic fixes.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span className="cf-status-pill">
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
                  Systems Operational (99.9% SLA)
                </span>
              </div>
            </div>

            <div>
              <div className="cf-footer-col-title">Citizen Services</div>
              <ul className="cf-footer-links">
                <li><Link to="/register" className="cf-footer-link">Report Civic Issue</Link></li>
                <li><Link to="/login" className="cf-footer-link">Track Complaint Status</Link></li>
                <li><Link to="/login" className="cf-footer-link">Submit Resolution Feedback</Link></li>
                <li><Link to="/login" className="cf-footer-link">Citizen Charter & SLAs</Link></li>
              </ul>
            </div>

            <div>
              <div className="cf-footer-col-title">Portals</div>
              <ul className="cf-footer-links">
                <li><Link to="/login" className="cf-footer-link">Citizen Portal</Link></li>
                <li><Link to="/login" className="cf-footer-link">Officer Triage Desk</Link></li>
                <li><Link to="/login" className="cf-footer-link">Field Worker App</Link></li>
                <li><Link to="/login" className="cf-footer-link">Platform Governance</Link></li>
              </ul>
            </div>

            <div>
              <div className="cf-footer-col-title">Municipal Helpline</div>
              <div className="cf-footer-contact-item">
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.07 3.37 2 2 0 0 1 3.08 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/></svg>
                </span>
                <div>
                  <strong>1800-CIVIC-FIX</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>24x7 Citizen Helpline</div>
                </div>
              </div>
              <div className="cf-footer-contact-item">
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <div>
                  <strong>support@civicfix.gov.in</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Municipal Grievance Support</div>
                </div>
              </div>
              <div className="cf-footer-contact-item">
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </span>
                <div>
                  <strong>Municipal Operations Center</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Smart City District, New Delhi</div>
                </div>
              </div>
            </div>
          </div>

          <div className="cf-footer-bottom">
            <div>
              © {new Date().getFullYear()} CivicFix Municipal Platform. All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Accessibility Compliance</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
