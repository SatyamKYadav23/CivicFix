import { Card } from '../../components/ui/Card.jsx'
import { Checkbox } from '../../components/ui/Checkbox.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Button } from '../../components/ui/Button.jsx'

export function AdminSettings() {
  return (
    <div>
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Platform Configuration</h1>
          <p className="cf-page-subtitle">Global platform limits, mock mode toggles, and system security policies.</p>
        </div>
      </div>

      <div style={{ maxWidth: '640px', display: 'grid', gap: 'var(--space-4)' }}>
        <Card title="System Environment & Mode">
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <Input id="env-name" label="Environment Name" defaultValue="CivicFix Development (Mock Data Active)" disabled />
            <Checkbox id="chk-mock" label="Mock Repository Persistence Enabled" defaultChecked disabled />
            <Checkbox id="chk-audit" label="Real-time audit logging enabled" defaultChecked />
          </div>
        </Card>

        <Card title="Platform SLA Defaults">
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <Input id="sla-crit" label="Critical Complaint SLA (Hours)" defaultValue="12" />
            <Input id="sla-high" label="High Complaint SLA (Hours)" defaultValue="24" />
            <Input id="sla-med" label="Medium/Low SLA (Hours)" defaultValue="48" />
            <Button>Save Platform Policies</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

