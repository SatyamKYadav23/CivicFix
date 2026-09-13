import { useAuth } from '../../hooks/useAuth.js'
import { Card } from '../../components/ui/Card.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Avatar } from '../../components/ui/Avatar.jsx'
import { Badge } from '../../components/ui/Badge.jsx'

export function AdminProfile() {
  const { user } = useAuth()
  const name = user?.name || 'System Administrator'
  const email = user?.email || 'admin@gmail.com'

  return (
    <div>
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Administrator Profile</h1>
          <p className="cf-page-subtitle">Master administrative credentials and audit authorization.</p>
        </div>
      </div>

      <div style={{ maxWidth: '640px' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <Avatar name={name} size="lg" />
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>{name}</h2>
              <p style={{ color: 'var(--color-neutral-600)' }}>{email}</p>
              <Badge variant="danger" style={{ marginTop: 'var(--space-1)' }}>SUPER ADMIN</Badge>
            </div>
          </div>

          <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
            <Input id="prof-name" label="Administrator Account" defaultValue={name} />
            <Input id="prof-email" label="Security Email" defaultValue={email} disabled />
            <Input id="prof-access" label="Access Scope" defaultValue="Global Platform Authority" disabled />

            <div className="cf-inline-wrap">
              <Button type="submit">Update Credentials</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

