import { useState } from 'react'
import { Button } from '../../components/ui/Button.jsx'

export function WorkerSettings() {
  const [pushNotifications, setPushNotifications] = useState(true)
  const [smsAlerts, setSmsAlerts] = useState(true)
  const [autoNavigate, setAutoNavigate] = useState(true)
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <div className="cf-worker-settings-page" style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Terminal Settings</h1>
          <p className="cf-page-subtitle">
            Configure mobile field dispatch notifications, alert preferences, and navigation behaviors.
          </p>
        </div>
      </div>

      <div className="cf-admin-panel-card" style={{ gap: 'var(--space-6)' }}>
        {isSaved && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600 }}>
            ✓ Terminal preferences saved successfully.
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-neutral-900)', margin: 0 }}>
              Dispatch & Alert Preferences
            </h3>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <strong style={{ display: 'block', color: 'var(--color-neutral-900)', fontSize: '0.9375rem' }}>
                  Real-time Emergency Push Notifications
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
                  Receive instant vibration and sound alerts for critical SLA emergencies.
                </span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <strong style={{ display: 'block', color: 'var(--color-neutral-900)', fontSize: '0.9375rem' }}>
                  SMS Dispatch Alerts
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
                  Receive text messages when a new work order is assigned to you.
                </span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoNavigate}
                onChange={(e) => setAutoNavigate(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <strong style={{ display: 'block', color: 'var(--color-neutral-900)', fontSize: '0.9375rem' }}>
                  Auto-Launch GPS Map Routing
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
                  Automatically open maps when starting a field repair task.
                </span>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-neutral-100)', paddingTop: 'var(--space-4)' }}>
            <Button type="submit">
              Save Preferences
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
