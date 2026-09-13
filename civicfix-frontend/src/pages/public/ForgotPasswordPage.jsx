import { Link } from 'react-router-dom'
import { AuthPageShell } from '../../components/layout/AuthPageShell.jsx'

export function ForgotPasswordPage() {
  return (
    <AuthPageShell
      title="Reset password"
      subtitle="Enter your account email to receive reset instructions."
      footer={
        <p>
          Remembered your password? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
        <div className="field">
          <label htmlFor="forgot-email">Email</label>
          <input id="forgot-email" name="email" type="email" autoComplete="email" required />
        </div>
        <button type="submit" className="btn btn-primary btn-full">
          Send reset link
        </button>
      </form>
    </AuthPageShell>
  )
}
