import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { complaintService } from '../../services/complaintService.js'
import { workerService } from '../../services/workerService.js'
import { authorityService } from '../../services/authorityService.js'
import { DashboardStats, RecentComplaints, ActivityFeed } from '../../components/dashboard/index.js'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { ErrorState } from '../../components/ui/ErrorState.jsx'
import { AssignWorkerModal } from '../../components/complaint/AssignWorkerModal.jsx'
import { COMPLAINT_STATUSES, COMPLAINT_PRIORITIES } from '../../utils/constants.js'

export function AuthorityDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [complaints, setComplaints] = useState([])
  const [workers, setWorkers] = useState([])
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [assigningComplaint, setAssigningComplaint] = useState(null)

  const loadDashboardData = useCallback(() => {
    setIsLoading(true)
    setError(null)
    const dept = user?.department || null
    Promise.all([
      complaintService.getComplaints({ authorityDepartment: dept }),
      workerService.getWorkers(dept),
      authorityService.getAnalytics().catch(() => null),
    ])
      .then(([complaintsData, workersData, analyticsData]) => {
        const complaintsList = Array.isArray(complaintsData) ? complaintsData : (complaintsData?.complaints || [])
        setComplaints(complaintsList)
        setWorkers(Array.isArray(workersData) ? workersData : (workersData?.workers || []))

        // Synthesize dynamic activity feed from recent complaints and updates
        const recentActivities = complaintsList.slice(0, 8).map((c) => ({
          id: `act-${c.id}`,
          actorName: c.citizen?.name || c.citizenName || 'Citizen',
          action: c.status === 'SUBMITTED' || c.status === 'REPORTED'
            ? 'submitted new civic report'
            : `updated status to ${c.status.replace(/_/g, ' ').toLowerCase()}`,
          targetId: c.complaintNumber || c.id,
          details: c.title,
          timestamp: c.updatedAt || c.createdAt,
        }))
        setActivities(recentActivities)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load authority dashboard data.')
        setIsLoading(false)
      })
  }, [user])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // KPI Calculations
  const totalCount = complaints.length
  const pendingReviewCount = complaints.filter(
    (c) => c.status === COMPLAINT_STATUSES.REPORTED || c.status === COMPLAINT_STATUSES.SUBMITTED || c.status === COMPLAINT_STATUSES.UNDER_REVIEW
  ).length
  const unassignedCount = complaints.filter(
    (c) =>
      !c.assignedWorker &&
      c.status !== COMPLAINT_STATUSES.RESOLVED &&
      c.status !== COMPLAINT_STATUSES.CLOSED &&
      c.status !== COMPLAINT_STATUSES.REJECTED
  ).length
  const highPriorityCount = complaints.filter(
    (c) =>
      (c.priority === COMPLAINT_PRIORITIES.HIGH || c.priority === COMPLAINT_PRIORITIES.CRITICAL) &&
      c.status !== COMPLAINT_STATUSES.CLOSED &&
      c.status !== COMPLAINT_STATUSES.RESOLVED
  ).length
  const inProgressCount = complaints.filter(
    (c) => c.status === COMPLAINT_STATUSES.IN_PROGRESS
  ).length
  const resolvedCount = complaints.filter(
    (c) => c.status === COMPLAINT_STATUSES.RESOLVED || c.status === COMPLAINT_STATUSES.CLOSED
  ).length

  if (error) {
    return (
      <ErrorState
        title="Failed to load triage desk"
        description={error}
        onRetry={loadDashboardData}
      />
    )
  }

  return (
    <div>
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Officer Triage & Operations Desk</h1>
          <p className="cf-page-subtitle">
            Welcome back, {user?.name || 'Officer'}. Review incoming reports, triage urgency, and manage field technicians.
          </p>
        </div>
        <Link to="/authority/complaints">
          <Button>Open Complaint Queue ({unassignedCount} Unassigned)</Button>
        </Link>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner />
        </div>
      ) : (
        <>
          {/* Top 6 KPI Stat Blocks */}
          <DashboardStats
            stats={[
              {
                label: 'Total Reports',
                value: String(totalCount),
                subtitle: 'All jurisdiction logs',
                iconVariant: 'primary',
              },
              {
                label: 'Pending Review',
                value: String(pendingReviewCount),
                subtitle: 'Requires officer triage',
                iconVariant: 'warning',
              },
              {
                label: 'Unassigned Tasks',
                value: String(unassignedCount),
                subtitle: 'Awaiting worker dispatch',
                iconVariant: 'warning',
              },
              {
                label: 'High / Critical SLA',
                value: String(highPriorityCount),
                subtitle: 'Emergency attention',
                iconVariant: 'danger',
              },
              {
                label: 'Field In Progress',
                value: String(inProgressCount),
                subtitle: 'Technicians on-site',
                iconVariant: 'primary',
              },
              {
                label: 'Resolved & Closed',
                value: String(resolvedCount),
                subtitle: 'Fixed municipal issues',
                iconVariant: 'success',
              },
            ]}
          />

          <div className="cf-showcase-grid" style={{ marginTop: 'var(--space-6)' }}>
            {/* Recent Complaints Stream with Quick Actions */}
            <RecentComplaints
              complaints={complaints.slice(0, 5)}
              title="Recent Incoming Grievances"
              onViewAll={() => navigate('/authority/complaints')}
              onSelectComplaint={(c) => navigate(`/authority/complaints/${c.id}`)}
              onAssign={(c) => setAssigningComplaint(c)}
            />

            {/* Worker Workload Overview & Activity Feed */}
            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              <Card title="Technician Capacity & Workload">
                <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                  {workers.map((w) => {
                    const active = w.activeTasks || w.workload?.active || 0
                    const completed = w.completedTasks || w.workload?.completed || 0

                    return (
                      <div
                        key={w.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 'var(--space-2) var(--space-3)',
                          backgroundColor: 'var(--color-neutral-50)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-neutral-200)',
                        }}
                      >
                        <div>
                          <strong>{w.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
                            {w.department}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <Badge variant={w.status === 'AVAILABLE' ? 'success' : 'warning'}>
                            {w.status || 'AVAILABLE'}
                          </Badge>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-600)', marginTop: '2px' }}>
                            <strong>{active}</strong> Active • <strong>{completed}</strong> Done
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <Link to="/authority/workers" className="link-button" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                      Manage All Field Technicians →
                    </Link>
                  </div>
                </div>
              </Card>

              {/* Activity Audit Stream */}
              <ActivityFeed
                activities={activities.slice(0, 4)}
                title="Officer & Field Activity Feed"
              />
            </div>
          </div>

          {/* Assign Worker Modal */}
          <AssignWorkerModal
            isOpen={Boolean(assigningComplaint)}
            complaint={assigningComplaint}
            onClose={() => setAssigningComplaint(null)}
            onAssigned={() => {
              setAssigningComplaint(null)
              loadDashboardData()
            }}
          />
        </>
      )}
    </div>
  )
}
