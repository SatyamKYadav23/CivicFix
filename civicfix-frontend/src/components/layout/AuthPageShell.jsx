import { Link } from 'react-router-dom'
import { CivicFixLogo } from '../ui/CivicFixLogo.jsx'

export function AuthPageShell({ title, subtitle, children, footer }) {
  return (
    <section className="auth-section">
      <div className="container auth-container">
        <div className="auth-card">
          <div className="auth-brand">
            <CivicFixLogo />
            <span>CivicFix</span>
          </div>
          <h1 className="auth-title">{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
          {children}
          <div className="auth-footer">{footer}</div>
          <p className="auth-alt-link">
            <Link to="/">Back to home</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
