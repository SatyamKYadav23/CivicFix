import { AppShell } from './AppShell.jsx'

const authorityNavItems = [
  { to: '/authority/dashboard', label: 'Dashboard' },
  { to: '/authority/complaints', label: 'Complaint Queue' },
  { to: '/authority/workers', label: 'Workers' },
  { to: '/authority/analytics', label: 'Analytics' },
  { to: '/authority/notifications', label: 'Notifications' },
  { to: '/authority/profile', label: 'Profile' },
  { to: '/authority/settings', label: 'Settings' },
]

export function AuthorityLayout() {
  return <AppShell role="AUTHORITY" navItems={authorityNavItems} />
}
