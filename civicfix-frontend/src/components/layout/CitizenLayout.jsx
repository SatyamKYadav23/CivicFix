import { AppShell } from './AppShell.jsx'

const citizenNavItems = [
  { to: '/citizen/dashboard', label: 'Dashboard' },
  { to: '/citizen/complaints/new', label: 'Report Complaint' },
  { to: '/citizen/complaints', label: 'My Complaints' },
  { to: '/citizen/notifications', label: 'Notifications' },
  { to: '/citizen/profile', label: 'Profile' },
  { to: '/citizen/settings', label: 'Settings' },
]

export function CitizenLayout() {
  return <AppShell role="CITIZEN" navItems={citizenNavItems} />
}
