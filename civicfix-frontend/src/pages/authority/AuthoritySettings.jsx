import { Card } from '../../components/ui/Card.jsx'
import { Checkbox } from '../../components/ui/Checkbox.jsx'
import { Button } from '../../components/ui/Button.jsx'

export function AuthoritySettings() {
  return (
    <div>
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Department Settings</h1>
          <p className="cf-page-subtitle">Configure triage rules, escalation timers, and officer alerts.</p>
        </div>
      </div>

      <div style={{ maxWidth: '640px', display: 'grid', gap: 'var(--space-4)' }}>
        <Card title="Alert Settings">
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <Checkbox id="set-crit" label="Instant SMS alert for CRITICAL complaints" defaultChecked />
            <Checkbox id="set-sla" label="Alert when complaint approaches 24h SLA limit" defaultChecked />
            <Checkbox id="set-worker" label="Notify when worker marks task resolved" defaultChecked />
          </div>
        </Card>

        <Card title="Auto-Assignment Automation">
          <p style={{ marginBottom: 'var(--space-3)', color: 'var(--color-neutral-600)' }}>
            Automate routine assignments based on worker proximity and category matching.
          </p>
          <Button variant="secondary">Configure Assignment Rules</Button>
        </Card>
      </div>
    </div>
  )
}

