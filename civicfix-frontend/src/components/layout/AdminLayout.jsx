import { AppShell } from './AppShell.jsx'

const adminNavItems = [
  // Section: Overview
  { isHeader: true, header: 'OVERVIEW' },
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/complaints', label: 'All Complaints' },

  // Section: Manage (The Core Management Suite)
  { isHeader: true, header: 'MANAGE' },
  { to: '/admin/authorities', label: 'Manage Authorities' },
  { to: '/admin/workers', label: 'Manage Workers' },
  { to: '/admin/citizens', label: 'Manage Citizens' },

  // Section: System Governance
  { isHeader: true, header: 'SYSTEM' },
  { to: '/admin/categories', label: 'Categories & SLAs' },
  { to: '/admin/analytics', label: 'Platform Analytics' },
  { to: '/admin/activity', label: 'System Audit Log' },
  { to: '/admin/settings', label: 'Settings' },
  { to: '/admin/profile', label: 'Profile' },
]

export function AdminLayout() {
  return <AppShell role="ADMIN" navItems={adminNavItems} />
}
