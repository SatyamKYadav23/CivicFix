import { useState } from 'react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  DataTable,
  Divider,
  Drawer,
  Dropdown,
  EmptyState,
  ErrorState,
  FileUploader,
  FilterBar,
  IconButton,
  Input,
  Modal,
  Pagination,
  Radio,
  SearchBar,
  Select,
  Skeleton,
  Spinner,
  Tabs,
  Textarea,
  Toast,
} from '../../components/ui/index.js'

import {
  ComplaintStatus,
  ComplaintPriority,
  ComplaintCard,
  ComplaintTable,
  ComplaintTimeline,
  ComplaintFilters,
} from '../../components/complaint/index.js'

import {
  StatCard,
  DashboardStats,
  RecentComplaints,
  ActivityFeed,
} from '../../components/dashboard/index.js'

import {
  NotificationItem,
  NotificationPanel,
} from '../../components/notification/index.js'

import {
  UserCard,
  UserTable,
} from '../../components/user/index.js'

import {
  COMPLAINT_STATUSES,
  COMPLAINT_PRIORITIES,
  NOTIFICATION_TYPES,
} from '../../utils/constants.js'

const NOW = Date.now()

// Sample dataset for domain showcases
const SAMPLE_COMPLAINTS = [
  {
    id: 'CF-1001',
    title: 'Broken street light at 4th Cross Main Gate',
    category: 'Street Lights',
    location: 'Sector 12, Block B, New Delhi',
    priority: COMPLAINT_PRIORITIES.HIGH,
    status: COMPLAINT_STATUSES.IN_PROGRESS,
    createdAt: new Date(NOW - 36 * 3600 * 1000).toISOString(),
    updatedAt: new Date(NOW - 2 * 3600 * 1000).toISOString(),
    assignedWorker: { id: 'w-1', name: 'Raj Kumar', phone: '9876543210' },
  },
  {
    id: 'CF-1002',
    title: 'Severe water pipe leakage near market square',
    category: 'Water Supply & Leakage',
    location: 'Sector 8 Market, New Delhi',
    priority: COMPLAINT_PRIORITIES.CRITICAL,
    status: COMPLAINT_STATUSES.UNDER_REVIEW,
    createdAt: new Date(NOW - 5 * 3600 * 1000).toISOString(),
    updatedAt: new Date(NOW - 30 * 60 * 1000).toISOString(),
    assignedWorker: null,
  },
  {
    id: 'CF-1003',
    title: 'Garbage dump overflowing outside community park',
    category: 'Sanitation & Garbage',
    location: 'Sector 4 Park Lane, New Delhi',
    priority: COMPLAINT_PRIORITIES.MEDIUM,
    status: COMPLAINT_STATUSES.ASSIGNED,
    createdAt: new Date(NOW - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(NOW - 4 * 3600 * 1000).toISOString(),
    assignedWorker: { id: 'w-2', name: 'Amit Sharma', phone: '9876543211' },
  },
  {
    id: 'CF-1004',
    title: 'Deep pothole causing vehicle damage near school zone',
    category: 'Roads & Potholes',
    location: 'Ring Road Junction, New Delhi',
    priority: COMPLAINT_PRIORITIES.CRITICAL,
    status: COMPLAINT_STATUSES.RESOLVED,
    createdAt: new Date(NOW - 72 * 3600 * 1000).toISOString(),
    updatedAt: new Date(NOW - 12 * 3600 * 1000).toISOString(),
    assignedWorker: { id: 'w-1', name: 'Raj Kumar' },
  },
  {
    id: 'CF-1005',
    title: 'Blocked drainage overflow during heavy rainfall',
    category: 'Drainage & Sewage',
    location: 'Sector 15 Alley 3, New Delhi',
    priority: COMPLAINT_PRIORITIES.LOW,
    status: COMPLAINT_STATUSES.REPORTED,
    createdAt: new Date(NOW - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date(NOW - 10 * 60 * 1000).toISOString(),
    assignedWorker: null,
  },
]

const SAMPLE_TIMELINE_EVENTS = [
  {
    id: 'evt-1',
    status: COMPLAINT_STATUSES.REPORTED,
    title: 'Complaint Reported',
    timestamp: new Date(NOW - 48 * 3600 * 1000).toISOString(),
    actor: 'Satyam Sharma (Citizen)',
    notes: 'Reported faulty street light causing safety hazard after 8 PM.',
    state: 'completed',
  },
  {
    id: 'evt-2',
    status: COMPLAINT_STATUSES.UNDER_REVIEW,
    title: 'Under Review',
    timestamp: new Date(NOW - 40 * 3600 * 1000).toISOString(),
    actor: 'Ankit Verma (Authority Officer)',
    notes: 'Verified jurisdiction. Priority raised to HIGH due to junction proximity.',
    state: 'completed',
  },
  {
    id: 'evt-3',
    status: COMPLAINT_STATUSES.ASSIGNED,
    title: 'Worker Assigned',
    timestamp: new Date(NOW - 24 * 3600 * 1000).toISOString(),
    actor: 'Ankit Verma (Authority Officer)',
    notes: 'Assigned to Electrical Department Field Worker Raj Kumar.',
    state: 'completed',
  },
  {
    id: 'evt-4',
    status: COMPLAINT_STATUSES.IN_PROGRESS,
    title: 'Work In Progress',
    timestamp: new Date(NOW - 4 * 3600 * 1000).toISOString(),
    actor: 'Raj Kumar (Worker)',
    notes: 'Replaced faulty wiring harness and bulb. Conducting testing.',
    state: 'active',
  },
  {
    id: 'evt-5',
    status: COMPLAINT_STATUSES.RESOLVED,
    title: 'Resolution Pending Verification',
    timestamp: null,
    actor: null,
    notes: null,
    state: 'pending',
  },
  {
    id: 'evt-6',
    status: COMPLAINT_STATUSES.CLOSED,
    title: 'Closed & Citizen Feedback',
    timestamp: null,
    actor: null,
    notes: null,
    state: 'pending',
  },
]

const SAMPLE_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: NOTIFICATION_TYPES.WORKER_ASSIGNED,
    title: 'Worker Assigned to your complaint',
    message: 'Raj Kumar has been assigned to "Broken street light at 4th Cross".',
    targetId: 'CF-1001',
    read: false,
    createdAt: new Date(NOW - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    type: NOTIFICATION_TYPES.COMPLAINT_RESOLVED,
    title: 'Complaint Resolved',
    message: 'Work completed for "Deep pothole causing vehicle damage". Please provide feedback.',
    targetId: 'CF-1004',
    read: false,
    createdAt: new Date(NOW - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    type: NOTIFICATION_TYPES.STATUS_UPDATED,
    title: 'Status Updated: Under Review',
    message: 'Authority officer Ankit Verma is currently reviewing "Water pipe leakage".',
    targetId: 'CF-1002',
    read: true,
    createdAt: new Date(NOW - 24 * 3600 * 1000).toISOString(),
  },
]

const INDIVIDUAL_NOTIF_1 = {
  id: 'sample-unread',
  type: NOTIFICATION_TYPES.ANNOUNCEMENT,
  title: 'Scheduled maintenance notice',
  message: 'Municipal water line maintenance in Sector 12 on Sunday.',
  read: false,
  createdAt: new Date(NOW - 30 * 60 * 1000).toISOString(),
}

const INDIVIDUAL_NOTIF_2 = {
  id: 'sample-read',
  type: NOTIFICATION_TYPES.FEEDBACK_SUBMITTED,
  title: 'Citizen left a 5-star rating',
  message: 'Feedback received for complaint CF-1004 resolution.',
  read: true,
  createdAt: new Date(NOW - 3600 * 1000).toISOString(),
}

const SAMPLE_ACTIVITIES = [
  {
    id: 'act-1',
    actorName: 'Raj Kumar',
    action: 'started repair work on',
    targetId: 'CF-1001',
    details: 'Sector 12 street light maintenance',
    timestamp: new Date(NOW - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'act-2',
    actorName: 'Ankit Verma',
    action: 'assigned worker Amit Sharma to',
    targetId: 'CF-1003',
    details: 'Sanitation team dispatch',
    timestamp: new Date(NOW - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: 'act-3',
    actorName: 'Satyam Sharma',
    action: 'submitted new civic report',
    targetId: 'CF-1005',
    details: 'Drainage overflow alert',
    timestamp: new Date(NOW - 8 * 3600 * 1000).toISOString(),
  },
]

const SAMPLE_USERS = [
  {
    id: 'u-1',
    name: 'Raj Kumar',
    email: 'raj.kumar@civicfix.gov.in',
    phone: '+91 98765 43210',
    role: 'WORKER',
    status: 'AVAILABLE',
    department: 'Electrical Division',
    workload: { active: 3, completed: 42 },
  },
  {
    id: 'u-2',
    name: 'Amit Sharma',
    email: 'amit.sharma@civicfix.gov.in',
    phone: '+91 98765 43211',
    role: 'WORKER',
    status: 'BUSY',
    department: 'Sanitation Division',
    workload: { active: 8, completed: 65 },
  },
  {
    id: 'u-3',
    name: 'Ankit Verma',
    email: 'ankit.verma@civicfix.gov.in',
    phone: '+91 98765 43212',
    role: 'AUTHORITY',
    status: 'ACTIVE',
    department: 'Municipal Operations',
  },
  {
    id: 'u-4',
    name: 'Satyam Sharma',
    email: 'satyam@citizen.org',
    phone: '+91 98765 43213',
    role: 'CITIZEN',
    status: 'ACTIVE',
  },
]

const PRIMITIVE_TABLE_COLUMNS = [
  { key: 'id', header: 'ID' },
  { key: 'title', header: 'Title' },
  { key: 'status', header: 'Status' },
]

const PRIMITIVE_TABLE_ROWS = [
  { id: 'CF-1012', title: 'Water leakage at Main Road', status: 'UNDER_REVIEW' },
  { id: 'CF-1034', title: 'Street light not working', status: 'ASSIGNED' },
]

export function DesignSystemPage() {
  // Primitives state
  const [currentPage, setCurrentPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)

  // Interactive Domain filters & search state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterPriority, setFilterPriority] = useState('ALL')
  const [filterCategory, setFilterCategory] = useState('ALL')

  // Notifications state
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS)

  // Selected complaint modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [actionMessage, setActionMessage] = useState('')

  // Filtered complaints computed
  const filteredComplaints = SAMPLE_COMPLAINTS.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesTitle = c.title.toLowerCase().includes(q)
      const matchesId = c.id.toLowerCase().includes(q)
      const matchesLoc = typeof c.location === 'string' && c.location.toLowerCase().includes(q)
      if (!matchesTitle && !matchesId && !matchesLoc) return false
    }
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false
    if (filterPriority !== 'ALL' && c.priority !== filterPriority) return false
    if (filterCategory !== 'ALL') {
      const catLower = c.category.toLowerCase()
      if (!catLower.includes(filterCategory.toLowerCase())) return false
    }
    return true
  })

  const handleResetFilters = () => {
    setSearchQuery('')
    setFilterStatus('ALL')
    setFilterPriority('ALL')
    setFilterCategory('ALL')
  }

  const handleToggleNotificationRead = (id, newRead) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: newRead } : n))
    )
  }

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleComplaintAction = (complaint, actionName) => {
    setSelectedComplaint(complaint)
    setActionMessage(`Triggered "${actionName}" action for ${complaint.id}: ${complaint.title}`)
  }

  return (
    <section className="content-section">
      <div className="container">
        <header style={{ marginBottom: 'var(--space-8)' }}>
          <div className="eyebrow">Design System & Domain Components</div>
          <h1 className="hero-title">CivicFix Component Showcase</h1>
          <p className="hero-description">
            Complete Phase 2 design system foundation and role-ready domain UI components for Citizen,
            Authority, Worker, and Admin interfaces.
          </p>
        </header>

        {/* ------------------------------------------------------------------ */}
        {/* DOMAIN SECTION 1: Status & Priority Badges                         */}
        {/* ------------------------------------------------------------------ */}
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <h2 className="section-title">1. Domain Status & Priority Badges</h2>
          <Card title="Status and Priority Indicators">
            <p style={{ marginBottom: 'var(--space-3)' }}>
              Standardized semantic badges for all 8 complaint lifecycle statuses and 4 priority levels:
            </p>
            <div className="cf-inline-wrap" style={{ marginBottom: 'var(--space-4)' }}>
              {Object.values(COMPLAINT_STATUSES).map((st) => (
                <ComplaintStatus key={st} status={st} />
              ))}
            </div>
            <Divider />
            <div className="cf-inline-wrap" style={{ marginTop: 'var(--space-4)' }}>
              {Object.values(COMPLAINT_PRIORITIES).map((pr) => (
                <ComplaintPriority key={pr} priority={pr} />
              ))}
            </div>
          </Card>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* DOMAIN SECTION 2: Role-Ready Complaint Cards                       */}
        {/* ------------------------------------------------------------------ */}
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <h2 className="section-title">2. Role-Ready Complaint Cards</h2>
          <p style={{ marginBottom: 'var(--space-4)', color: 'var(--color-neutral-600)' }}>
            Responsive cards showing urgency highlights, category, location, status, and role actions:
          </p>
          <div className="cf-showcase-grid">
            <ComplaintCard
              complaint={SAMPLE_COMPLAINTS[0]}
              role="CITIZEN"
              onView={(c) => handleComplaintAction(c, 'View Details (Citizen)')}
            />
            <ComplaintCard
              complaint={SAMPLE_COMPLAINTS[1]}
              role="AUTHORITY"
              onView={(c) => handleComplaintAction(c, 'Review (Authority)')}
              onAssign={(c) => handleComplaintAction(c, 'Assign Worker')}
            />
            <ComplaintCard
              complaint={SAMPLE_COMPLAINTS[2]}
              role="WORKER"
              actionLabel="Start Work →"
              onAction={(c) => handleComplaintAction(c, 'Start Work (Worker)')}
            />
            <ComplaintCard
              complaint={SAMPLE_COMPLAINTS[3]}
              role="ADMIN"
              onView={(c) => handleComplaintAction(c, 'View Resolution (Admin)')}
            />
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* DOMAIN SECTION 3: Complaint Lifecycle Timeline                     */}
        {/* ------------------------------------------------------------------ */}
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <h2 className="section-title">3. Complaint Lifecycle Timeline</h2>
          <div className="cf-showcase-grid">
            <Card title="Live Multi-Step Progression (In Progress)">
              <ComplaintTimeline
                events={SAMPLE_TIMELINE_EVENTS}
                currentStatus={COMPLAINT_STATUSES.IN_PROGRESS}
              />
            </Card>

            <Card title="Linear Step Progress (Default State Tracker)">
              <ComplaintTimeline
                currentStatus={COMPLAINT_STATUSES.ASSIGNED}
              />
            </Card>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* DOMAIN SECTION 4: Interactive Filters & Complaint Table            */}
        {/* ------------------------------------------------------------------ */}
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <h2 className="section-title">4. Complaint Filters & Data Table</h2>
          <ComplaintFilters
            searchTerm={searchQuery}
            status={filterStatus}
            priority={filterPriority}
            category={filterCategory}
            onSearchChange={setSearchQuery}
            onStatusChange={setFilterStatus}
            onPriorityChange={setFilterPriority}
            onCategoryChange={setFilterCategory}
            onReset={handleResetFilters}
            totalCount={filteredComplaints.length}
          />

          <ComplaintTable
            complaints={filteredComplaints}
            role="AUTHORITY"
            onView={(c) => handleComplaintAction(c, 'View Table Item')}
            onAssign={(c) => handleComplaintAction(c, 'Assign Worker')}
          />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* DOMAIN SECTION 5: Dashboard Stat Blocks (Role Presets)             */}
        {/* ------------------------------------------------------------------ */}
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <h2 className="section-title">5. Dashboard Stat Blocks</h2>
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-3)', color: 'var(--color-neutral-700)' }}>
            Authority / Admin Operational KPIs:
          </h3>
          <DashboardStats
            stats={[
              {
                label: 'Total Complaints',
                value: '142',
                subtitle: 'All time reported',
                icon: '📋',
                iconVariant: 'primary',
                trend: '+12% this week',
                trendDirection: 'up',
                onClick: () => setActionMessage('Clicked Stat: Total Complaints'),
              },
              {
                label: 'Pending Review',
                value: '18',
                subtitle: 'Requires authority action',
                icon: '⏳',
                iconVariant: 'warning',
                trend: '+4 today',
                trendDirection: 'up',
                onClick: () => setActionMessage('Clicked Stat: Pending Review'),
              },
              {
                label: 'In Progress',
                value: '29',
                subtitle: 'Active field tasks',
                icon: '⚡',
                iconVariant: 'primary',
                trend: '3 near SLA',
                trendDirection: 'neutral',
                onClick: () => setActionMessage('Clicked Stat: In Progress'),
              },
              {
                label: 'Resolved',
                value: '95',
                subtitle: 'Resolution rate 88%',
                icon: '✅',
                iconVariant: 'success',
                trend: '+15 this week',
                trendDirection: 'up',
                onClick: () => setActionMessage('Clicked Stat: Resolved'),
              },
            ]}
          />

          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-3)', color: 'var(--color-neutral-700)' }}>
            Citizen Dashboard Quick Stats:
          </h3>
          <DashboardStats
            stats={[
              {
                label: 'My Complaints',
                value: '4',
                subtitle: 'Reported by you',
                icon: '📝',
                iconVariant: 'primary',
              },
              {
                label: 'Active & In Progress',
                value: '2',
                subtitle: 'Being handled now',
                icon: '🔄',
                iconVariant: 'warning',
              },
              {
                label: 'Resolved',
                value: '2',
                subtitle: 'Feedback ready',
                icon: '⭐',
                iconVariant: 'success',
              },
            ]}
          />

          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-3)', color: 'var(--color-neutral-700)' }}>
            Single Standalone Stat Card:
          </h3>
          <div style={{ maxWidth: '320px' }}>
            <StatCard
              label="Field Workload"
              value="8 Tasks"
              subtitle="2 high priority"
              icon="👷"
              iconVariant="warning"
              trend="Due in 24h"
              trendDirection="neutral"
              onClick={() => setActionMessage('Clicked Single Stat Card')}
            />
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* DOMAIN SECTION 6: Recent Complaints & Activity Feed                */}
        {/* ------------------------------------------------------------------ */}
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <h2 className="section-title">6. Recent Complaints & Activity Feed</h2>
          <div className="cf-showcase-grid">
            <RecentComplaints
              complaints={SAMPLE_COMPLAINTS.slice(0, 3)}
              title="Recent Complaints Queue"
              onViewAll={() => setActionMessage('Clicked "View all recent complaints"')}
              onSelectComplaint={(c) => handleComplaintAction(c, 'Selected from Recent Widget')}
            />

            <ActivityFeed
              activities={SAMPLE_ACTIVITIES}
              title="System Activity Stream"
              onSelectEntity={(id) => setActionMessage(`Selected entity from Activity Feed: ${id}`)}
            />
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* DOMAIN SECTION 7: Notification Items & Interactive Panel           */}
        {/* ------------------------------------------------------------------ */}
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <h2 className="section-title">7. Notification System</h2>
          <div className="cf-showcase-grid">
            <NotificationPanel
              notifications={notifications}
              onSelectNotification={(n) => handleComplaintAction({ id: n.targetId, title: n.title }, 'Open Notification')}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onToggleRead={handleToggleNotificationRead}
            />

            <Card title="Individual Notification Items">
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <NotificationItem
                  notification={INDIVIDUAL_NOTIF_1}
                  onToggleRead={() => {}}
                />
                <NotificationItem
                  notification={INDIVIDUAL_NOTIF_2}
                  onToggleRead={() => {}}
                />
              </div>
            </Card>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* DOMAIN SECTION 8: User Profile Cards & Management Table            */}
        {/* ------------------------------------------------------------------ */}
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <h2 className="section-title">8. User Directory & Worker Management</h2>
          <div className="cf-showcase-grid" style={{ marginBottom: 'var(--space-4)' }}>
            <UserCard
              user={SAMPLE_USERS[0]}
              onView={(u) => setActionMessage(`View User Details: ${u.name}`)}
              onAssign={(u) => setActionMessage(`Assign task to ${u.name}`)}
              onToggleStatus={(u) => setActionMessage(`Toggle status for ${u.name}`)}
            />
            <UserCard
              user={SAMPLE_USERS[1]}
              onView={(u) => setActionMessage(`View User Details: ${u.name}`)}
              onAssign={(u) => setActionMessage(`Assign task to ${u.name}`)}
              onToggleStatus={(u) => setActionMessage(`Toggle status for ${u.name}`)}
            />
          </div>

          <UserTable
            users={SAMPLE_USERS}
            onView={(u) => setActionMessage(`View user row: ${u.name}`)}
            onToggleStatus={(u) => setActionMessage(`Toggle user status: ${u.name}`)}
          />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* PRIMITIVES BASELINE SHOWCASE                                       */}
        {/* ------------------------------------------------------------------ */}
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <h2 className="section-title">9. Primitive UI Components Baseline</h2>
          <div className="cf-showcase-grid">
            <Card title="Buttons and icon buttons">
              <div className="cf-inline-wrap">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="ghost">Ghost</Button>
                <Button loading>Loading</Button>
                <IconButton label="Open notification panel">i</IconButton>
              </div>
            </Card>

            <Card title="Input controls">
              <Input id="sample-title" label="Complaint title" placeholder="Enter complaint title" />
              <Select
                id="sample-category"
                label="Category"
                options={[
                  { value: 'roads', label: 'Roads & Potholes' },
                  { value: 'water', label: 'Water Supply' },
                ]}
              />
              <Textarea id="sample-description" label="Description" rows={3} placeholder="Describe the issue..." />
              <div className="cf-inline-wrap">
                <Checkbox id="sample-terms" label="I confirm details are accurate" />
                <Radio id="sample-priority-high" name="priority" label="High priority" />
              </div>
            </Card>

            <Card title="Status and feedback">
              <div className="cf-inline-wrap">
                <Badge variant="success">RESOLVED</Badge>
                <Badge variant="warning">UNDER_REVIEW</Badge>
                <Badge variant="danger">REJECTED</Badge>
                <Badge>NEW</Badge>
              </div>
              <Divider />
              <div className="cf-inline-wrap">
                <Spinner />
                <Skeleton width="160px" />
                <Skeleton width="40px" height="40px" circle />
                <Avatar name="Riya Kumar" />
              </div>
            </Card>

            <Card title="Search, filter and file upload">
              <SearchBar placeholder="Search complaints" onSearch={() => {}} onClear={() => {}} />
              <FilterBar onApply={() => {}} onReset={() => {}}>
                <Select
                  id="filter-status-demo"
                  label="Status"
                  options={[
                    { value: 'REPORTED', label: 'REPORTED' },
                    { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
                  ]}
                />
              </FilterBar>
              <FileUploader
                label="Evidence file"
                helperText="Accepted formats: JPG, PNG, PDF"
                onFilesSelected={() => {}}
              />
            </Card>

            <Card title="Tabs, table and pagination">
              <Tabs
                tabs={[
                  { id: 'recent', label: 'Recent', content: <p>Recent complaints view</p> },
                  { id: 'assigned', label: 'Assigned', content: <p>Assigned complaints view</p> },
                ]}
              />
              <DataTable columns={PRIMITIVE_TABLE_COLUMNS} rows={PRIMITIVE_TABLE_ROWS} />
              <Pagination page={currentPage} total={5} onPageChange={setCurrentPage} />
            </Card>

            <Card title="Dropdown, modal, drawer and toast">
              <div className="cf-inline-wrap">
                <Dropdown
                  label="Queue actions"
                  items={[
                    { value: 'assign', label: 'Assign worker' },
                    { value: 'mark-review', label: 'Move to review' },
                  ]}
                />
                <Button variant="secondary" onClick={() => setModalOpen(true)}>
                  Open modal
                </Button>
                <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
                  Open drawer
                </Button>
                <Button variant="ghost" onClick={() => setShowToast((current) => !current)}>
                  Toggle toast
                </Button>
              </div>
              {showToast && (
                <Toast
                  variant="success"
                  title="Saved"
                  message="Complaint details were saved successfully."
                  onClose={() => setShowToast(false)}
                />
              )}
              <Modal
                open={modalOpen}
                title="Confirm assignment"
                onClose={() => setModalOpen(false)}
                footer={
                  <>
                    <Button variant="ghost" onClick={() => setModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setModalOpen(false)}>Confirm</Button>
                  </>
                }
              >
                <p>Assign this complaint to the selected worker?</p>
              </Modal>
              <Drawer open={drawerOpen} title="Notifications" onClose={() => setDrawerOpen(false)}>
                <p>No new notifications right now.</p>
              </Drawer>
            </Card>
          </div>

          <div className="cf-showcase-grid">
            <EmptyState
              title="No complaints found"
              description="No civic reports match your filter criteria."
              action={<Button>Clear Filters</Button>}
            />
            <ErrorState
              title="Failed to load complaints"
              description="Unable to reach local data service. Please retry."
              onRetry={() => {}}
            />
          </div>
        </div>

        {/* Selected Complaint Detail Modal */}
        {selectedComplaint && (
          <Modal
            open={Boolean(selectedComplaint)}
            title={`Complaint Details — ${selectedComplaint.id}`}
            onClose={() => setSelectedComplaint(null)}
            footer={
              <Button onClick={() => setSelectedComplaint(null)}>Close</Button>
            }
          >
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <div>
                <strong>Title:</strong> {selectedComplaint.title}
              </div>
              {selectedComplaint.category && (
                <div>
                  <strong>Category:</strong> {selectedComplaint.category}
                </div>
              )}
              {selectedComplaint.location && (
                <div>
                  <strong>Location:</strong>{' '}
                  {typeof selectedComplaint.location === 'object'
                    ? selectedComplaint.location.address
                    : selectedComplaint.location}
                </div>
              )}
              {selectedComplaint.status && (
                <div className="cf-inline-wrap">
                  <strong>Status:</strong> <ComplaintStatus status={selectedComplaint.status} />
                </div>
              )}
              {selectedComplaint.priority && (
                <div className="cf-inline-wrap">
                  <strong>Priority:</strong> <ComplaintPriority priority={selectedComplaint.priority} />
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Action feedback toast for interactive preview feedback */}
        {actionMessage && (
          <Toast
            variant="info"
            title="Interactive Preview Action"
            message={actionMessage}
            onClose={() => setActionMessage('')}
          />
        )}
      </div>
    </section>
  )
}
