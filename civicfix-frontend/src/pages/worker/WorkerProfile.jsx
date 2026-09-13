import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'

export function WorkerProfile() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name || 'Raj Kumar')
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43211')
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <div className="cf-worker-profile-page" style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Technician Profile</h1>
          <p className="cf-page-subtitle">
            View your operational credentials, department specialization, and verified credentials.
          </p>
        </div>
      </div>

      <div className="cf-admin-panel-card" style={{ gap: 'var(--space-6)' }}>
        {/* Identity Block */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', borderBottom: '1px solid var(--color-neutral-100)', paddingBottom: 'var(--space-4)' }}>
          <div className="cf-wmc-avatar" style={{ width: '64px', height: '64px', fontSize: '2rem' }}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <span>👷</span>
            )}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-neutral-950)' }}>{user?.name || 'Field Technician'}</h2>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '4px', alignItems: 'center' }}>
              <Badge variant="warning">FIELD WORKER</Badge>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-neutral-500)' }}>
                ⭐ {user?.rating || '4.9'} / 5.0 Rating
              </span>
            </div>
          </div>
        </div>

        {isSaved && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600 }}>
            ✓ Profile information saved successfully.
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="cf-form-group">
            <label className="cf-form-label">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="cf-form-input"
              required
            />
          </div>

          <div className="cf-grid-2">
            <div className="cf-form-group">
              <label className="cf-form-label">Official Email</label>
              <input
                type="email"
                value={user?.email || 'raj.kumar@civicfix.gov.in'}
                disabled
                className="cf-form-input"
                style={{ background: '#f8fafc' }}
              />
            </div>

            <div className="cf-form-group">
              <label className="cf-form-label">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="cf-form-input"
              />
            </div>
          </div>

          <div className="cf-form-group">
            <label className="cf-form-label">Municipal Department Division</label>
            <input
              type="text"
              value={user?.department || 'Electrical Division'}
              disabled
              className="cf-form-input"
              style={{ background: '#f8fafc' }}
            />
          </div>

          <div className="cf-form-group">
            <label className="cf-form-label">Certified Technical Skills</label>
            <input
              type="text"
              value={user?.skills?.join(', ') || 'Street Lighting, Wiring Harness, Power Grid'}
              disabled
              className="cf-form-input"
              style={{ background: '#f8fafc' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
            <Button type="submit">
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
