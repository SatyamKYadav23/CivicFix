import { useState } from 'react'
import { Card } from '../../components/ui/Card.jsx'
import { Checkbox } from '../../components/ui/Checkbox.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Toast } from '../../components/ui/Toast.jsx'

export function CitizenSettings() {
  const [prefStatus, setPrefStatus] = useState(true)
  const [prefAssign, setPrefAssign] = useState(true)
  const [prefResolve, setPrefResolve] = useState(true)
  const [prefAnnounce, setPrefAnnounce] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const handleSavePreferences = () => {
    setShowToast(true)
  }

  return (
    <div>
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Notification & Account Settings</h1>
          <p className="cf-page-subtitle">Configure your communication channels and security preferences.</p>
        </div>
      </div>

      <div style={{ maxWidth: '640px', display: 'grid', gap: 'var(--space-4)' }}>
        <Card title="Notification Channels">
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <Checkbox
              id="pref-status"
              label="Notify when complaint status is updated"
              checked={prefStatus}
              onChange={(e) => setPrefStatus(e.target.checked)}
            />
            <Checkbox
              id="pref-assign"
              label="Notify when a field technician is assigned"
              checked={prefAssign}
              onChange={(e) => setPrefAssign(e.target.checked)}
            />
            <Checkbox
              id="pref-resolve"
              label="Notify when complaint is marked resolved"
              checked={prefResolve}
              onChange={(e) => setPrefResolve(e.target.checked)}
            />
            <Checkbox
              id="pref-announcement"
              label="Receive municipal community announcements"
              checked={prefAnnounce}
              onChange={(e) => setPrefAnnounce(e.target.checked)}
            />

            <div style={{ marginTop: 'var(--space-2)' }}>
              <Button size="sm" onClick={handleSavePreferences}>
                Save Preferences
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Account Security">
          <p style={{ marginBottom: 'var(--space-3)', color: 'var(--color-neutral-600)' }}>
            Your account is authenticated via CivicFix Local Mock Session.
          </p>
          <Button variant="secondary" onClick={() => alert('Password update modal simulated.')}>
            Change Password
          </Button>
        </Card>
      </div>

      {showToast && (
        <Toast
          variant="success"
          title="Settings Saved"
          message="Your notification preferences have been saved."
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  )
}
