import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AuthPageShell } from '../../components/layout/AuthPageShell.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { Button } from '../../components/ui/Button.jsx'

export function LoginPage() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const from = location.state?.from?.pathname

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    setErrorMessage('')

    try {
      // Auto-detects user role and credentials on backend authentication
      const user = await login(email, password)

      if (from) {
        navigate(from, { replace: true })
      } else {
        const roleRedirects = {
          CITIZEN: '/citizen/dashboard',
          AUTHORITY: '/authority/dashboard',
          WORKER: '/worker/dashboard',
          ADMIN: '/admin/dashboard',
        }
        navigate(roleRedirects[user.role] || '/', { replace: true })
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your email and password.')
    }
  }

  return (
    <AuthPageShell
      title="Welcome back"
      subtitle="Sign in to continue tracking and managing civic complaints."
      footer={
        <>
          <p>
            Forgot your password? <Link to="/forgot-password">Reset it</Link>
          </p>
          <p>
            New to CivicFix? <Link to="/register">Create an account</Link>
          </p>
        </>
      }
    >
      {errorMessage && (
        <div className="cf-auth-error-banner">
          {errorMessage}
        </div>
      )}

      <form className="auth-form" onSubmit={handleLogin}>
        {/* Email Address */}
        <div className="field">
          <label htmlFor="login-email">Email Address</label>
          <input
            id="login-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="Enter your email address"
            required
          />
        </div>

        {/* Password */}
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <div className="password-field">
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              className="link-button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Sign In Button */}
        <Button type="submit" loading={isLoading} className="btn-full">
          Sign In
        </Button>
      </form>
    </AuthPageShell>
  )
}
