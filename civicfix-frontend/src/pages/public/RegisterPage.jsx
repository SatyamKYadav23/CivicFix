import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthPageShell } from '../../components/layout/AuthPageShell.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { Button } from '../../components/ui/Button.jsx'

export function RegisterPage() {
  const { register, isLoading } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    try {
      await register({ name, email, phone, password })
      navigate('/citizen/dashboard', { replace: true })
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed.')
    }
  }

  return (
    <AuthPageShell
      title="Create your account"
      subtitle="Register to report issues, monitor updates, and share feedback."
      footer={
        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      {errorMessage && (
        <div style={{ padding: 'var(--space-3)', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
          {errorMessage}
        </div>
      )}

      <form className="auth-form" onSubmit={handleRegister}>
        <div className="field">
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="e.g. Rahul Sharma"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="e.g. rahul@example.com"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="register-phone">Phone</label>
          <input
            id="register-phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="+91 98765 00000"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="register-password">Password</label>
          <div className="password-field">
            <input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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
        <div className="field">
          <label htmlFor="register-confirm-password">Confirm password</label>
          <div className="password-field">
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="link-button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <Button type="submit" loading={isLoading} className="btn-full">
          Create Citizen Account
        </Button>
      </form>
    </AuthPageShell>
  )
}
