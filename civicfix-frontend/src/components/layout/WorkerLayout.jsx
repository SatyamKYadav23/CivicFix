import { AppShell } from './AppShell.jsx'

const workerNavItems = [
  { to: '/worker/dashboard', label: 'Dashboard' },
  { to: '/worker/complaints', label: 'Assigned Tasks' },
  { to: '/worker/notifications', label: 'Notifications' },
  { to: '/worker/profile', label: 'My Profile' },
  { to: '/worker/settings', label: 'Settings' },
]

export function WorkerLayout() {
  return <AppShell role="WORKER" navItems={workerNavItems} />
}
