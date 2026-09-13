import { useAuth } from '../../hooks/useAuth.js'
import { Card } from '../../components/ui/Card.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Avatar } from '../../components/ui/Avatar.jsx'
import { Badge } from '../../components/ui/Badge.jsx'

export function AuthorityProfile() {
  const { user } = useAuth()
  const name = user?.name || 'Authority Officer'
  const email = user?.email || 'officer@civicfix.gov.in'
  const department = user?.department || 'Municipal Division'
  const zone = user?.zone || 'City Jurisdiction'

  return (
    <div>
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Officer Profile</h1>
          <p className="cf-page-subtitle">Department credentials and jurisdiction management.</p>
        </div>
      </div>

      <div style={{ maxWidth: '640px' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <Avatar name={name} size="lg" />
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>{name}</h2>
              <p style={{ color: 'var(--color-neutral-600)' }}>{email}</p>
              <Badge variant="primary" style={{ marginTop: 'var(--space-1)' }}>AUTHORITY</Badge>
            </div>
          </div>

          <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
            <Input id="prof-name" label="Officer Name" defaultValue={name} />
            <Input id="prof-email" label="Official Email" defaultValue={email} disabled />
            <Input id="prof-dept" label="Department" defaultValue={department} disabled />
            <Input id="prof-zone" label="Assigned Zone" defaultValue={zone} />

            <div className="cf-inline-wrap">
              <Button type="submit">Update Profile</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

