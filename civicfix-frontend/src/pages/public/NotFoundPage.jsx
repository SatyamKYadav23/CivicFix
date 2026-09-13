import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="state-page">
      <div className="container state-card">
        <h1>Page not found</h1>
        <p>The page you requested does not exist in CivicFix.</p>
        <div className="state-actions">
          <Link to="/" className="btn btn-primary">
            Return Home
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Go to Sign In
          </Link>
        </div>
      </div>
    </section>
  )
}
