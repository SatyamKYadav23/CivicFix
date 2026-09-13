import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { Card } from '../../components/ui/Card.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Avatar } from '../../components/ui/Avatar.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Toast } from '../../components/ui/Toast.jsx'

export function CitizenProfile() {
  const { user, updateProfile, isLoading } = useAuth()

  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState(user?.address || '')
  const [showToast, setShowToast] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    await updateProfile({ name, phone, address })
    setShowToast(true)
  }

  return (
    <div>
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Citizen Profile</h1>
          <p className="cf-page-subtitle">Manage your personal details, contact info, and preferred addresses.</p>
        </div>
      </div>

      <div style={{ maxWidth: '640px' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <Avatar name={user?.name || 'Citizen'} size="lg" />
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>{user?.name || 'Citizen'}</h2>
              <p style={{ color: 'var(--color-neutral-600)' }}>{user?.email || 'citizen@civicfix.org'}</p>
              <Badge variant="neutral" style={{ marginTop: 'var(--space-1)' }}>CITIZEN</Badge>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <Input
              id="prof-name"
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              id="prof-email"
              label="Email Address"
              value={user?.email || ''}
              disabled
            />
            <Input
              id="prof-phone"
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 00000"
            />
            <Input
              id="prof-address"
              label="Primary Neighborhood / Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Sector 12, Block B, New Delhi"
            />

            <div className="cf-inline-wrap">
              <Button type="submit" loading={isLoading}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {showToast && (
        <Toast
          variant="success"
          title="Profile Updated"
          message="Your personal details were saved successfully."
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  )
}
