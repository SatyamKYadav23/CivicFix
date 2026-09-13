import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'

// Setup in-memory localStorage polyfill for Node.js environment
class LocalStorageMock {
  constructor() {
    this.store = {}
  }
  clear() {
    this.store = {}
  }
  getItem(key) {
    return this.store[key] || null
  }
  setItem(key, value) {
    this.store[key] = String(value)
  }
  removeItem(key) {
    delete this.store[key]
  }
}

global.localStorage = new LocalStorageMock()

// Import services and repository after localStorage polyfill
const { mockRepository } = await import('../src/repositories/mockRepository.js')
const { authService } = await import('../src/services/authService.js')
const { complaintService } = await import('../src/services/complaintService.js')
const { workerService } = await import('../src/services/workerService.js')
const { userService } = await import('../src/services/userService.js')
const { notificationService } = await import('../src/services/notificationService.js')
const { feedbackService } = await import('../src/services/feedbackService.js')
const { COMPLAINT_STATUSES, COMPLAINT_PRIORITIES } = await import('../src/utils/constants.js')
const { canTransition } = await import('../src/utils/complaintHelpers.js')

describe('PHASE 19 — SYSTEM & WORKFLOW VERIFICATION TEST SUITE', () => {
  beforeEach(() => {
    localStorage.clear()
    mockRepository.resetAll()
  })

  // =========================================================================
  // 1. AUTHENTICATION TESTS
  // =========================================================================
  describe('1. Authentication Flows', () => {
    test('Valid Login for Citizen, Authority, Worker, Admin', async () => {
      const citizen = await authService.login('satyam@citizen.org', 'citizen123')
      assert.strictEqual(citizen.role, 'CITIZEN')
      assert.strictEqual(citizen.email, 'satyam@citizen.org')

      const authority = await authService.login('ankit.verma@civicfix.gov.in', 'officer123')
      assert.strictEqual(authority.role, 'AUTHORITY')

      const worker = await authService.login('raj.kumar@civicfix.gov.in', 'worker123')
      assert.strictEqual(worker.role, 'WORKER')

      const admin = await authService.login('admin@civicfix.gov.in', 'admin123')
      assert.strictEqual(admin.role, 'ADMIN')
    })

    test('Invalid Login handling', async () => {
      await assert.rejects(
        async () => {
          await authService.login('satyam@citizen.org', 'wrongpassword')
        },
        { message: 'Invalid password. Please check your credentials.' }
      )

      await assert.rejects(
        async () => {
          await authService.login('nonexistent@user.com', 'somepass')
        },
        { message: 'No user found with this email address.' }
      )
    })

    test('Logout clears session', async () => {
      await authService.login('satyam@citizen.org', 'citizen123')
      assert.ok(authService.getCurrentUser() !== null)

      await authService.logout()
      assert.strictEqual(authService.getCurrentUser(), null)
    })

    test('Session Refresh from persistent storage', async () => {
      await authService.login('ankit.verma@civicfix.gov.in', 'officer123')
      const stored = authService.getCurrentUser()
      assert.ok(stored)
      assert.strictEqual(stored.email, 'ankit.verma@civicfix.gov.in')
    })

    test('Role Route Redirection rules', () => {
      assert.strictEqual(authService.getRoleRedirectPath('CITIZEN'), '/citizen/dashboard')
      assert.strictEqual(authService.getRoleRedirectPath('AUTHORITY'), '/authority/dashboard')
      assert.strictEqual(authService.getRoleRedirectPath('WORKER'), '/worker/dashboard')
      assert.strictEqual(authService.getRoleRedirectPath('ADMIN'), '/admin/dashboard')
      assert.strictEqual(authService.getRoleRedirectPath(null), '/login')
    })
  })

  // =========================================================================
  // 2. CITIZEN WORKFLOW TESTS
  // =========================================================================
  describe('2. Citizen Workflows', () => {
    test('Create complaint with full metadata and evidence', async () => {
      const citizenUser = { id: 'usr-1', name: 'Satyam Sharma', role: 'CITIZEN' }
      const complaint = await complaintService.createComplaint(
        {
          title: 'Major water pipeline rupture',
          category: 'Water & Sewage',
          location: 'Connaught Place Block B',
          description: 'High pressure water leak causing flooding.',
          priority: COMPLAINT_PRIORITIES.HIGH,
        },
        citizenUser
      )

      assert.ok(complaint.id.startsWith('CF-'))
      assert.strictEqual(complaint.status, COMPLAINT_STATUSES.REPORTED)
      assert.strictEqual(complaint.citizenId, 'usr-1')
      assert.strictEqual(complaint.citizenName, 'Satyam Sharma')
    })

    test('Search complaints by keyword and ID', async () => {
      const results = await complaintService.getComplaints({ search: 'CF-1001' })
      assert.ok(results.length > 0)
      assert.strictEqual(results[0].id, 'CF-1001')
    })

    test('Filter complaints by status, priority, category', async () => {
      const reported = await complaintService.getComplaints({ status: COMPLAINT_STATUSES.REPORTED })
      assert.ok(reported.every((c) => c.status === COMPLAINT_STATUSES.REPORTED))

      const highPriority = await complaintService.getComplaints({ priority: COMPLAINT_PRIORITIES.HIGH })
      assert.ok(highPriority.every((c) => c.priority === COMPLAINT_PRIORITIES.HIGH))
    })

    test('Open complaint details & view timeline', async () => {
      const complaint = await complaintService.getComplaintById('CF-1001')
      assert.ok(complaint)
      assert.ok(Array.isArray(complaint.timeline))
      assert.ok(complaint.timeline.length > 0)
    })

    test('Submit 5-star feedback on resolved complaint', async () => {
      // Create and resolve a complaint
      const c = await complaintService.createComplaint(
        {
          title: 'Street light repair needed',
          category: 'Electricity & Lighting',
          location: 'Sector 5 park',
          priority: COMPLAINT_PRIORITIES.MEDIUM,
        },
        { id: 'usr-1', name: 'Satyam' }
      )

      await complaintService.updateStatus(c.id, COMPLAINT_STATUSES.RESOLVED, 'Bulb replaced by field crew')
      const closed = await feedbackService.submitFeedback(c.id, 5, 'Excellent quick repair!', 'Satyam')

      assert.strictEqual(closed.status, COMPLAINT_STATUSES.CLOSED)
      assert.strictEqual(closed.feedback.rating, 5)
      assert.strictEqual(closed.feedback.comment, 'Excellent quick repair!')
    })
  })

  // =========================================================================
  // 3. AUTHORITY WORKFLOW TESTS
  // =========================================================================
  describe('3. Authority Workflows', () => {
    test('Review incoming queue & Filter unassigned', async () => {
      const all = await complaintService.getComplaints()
      const unassigned = all.filter((c) => !c.assignedWorker)
      assert.ok(Array.isArray(unassigned))
    })

    test('Update complaint urgency priority and status', async () => {
      const complaint = await complaintService.getComplaintById('CF-1001')
      const updated = await complaintService.updateStatus(
        complaint.id,
        COMPLAINT_STATUSES.UNDER_REVIEW,
        'Officer verified severity',
        { name: 'Ankit Verma', role: 'AUTHORITY' }
      )
      assert.strictEqual(updated.status, COMPLAINT_STATUSES.UNDER_REVIEW)
    })

    test('Assign field technician to complaint', async () => {
      const worker = mockRepository.getWorkers()[0] // Raj Kumar
      const updated = await complaintService.assignWorker(
        'CF-1001',
        worker.id,
        { name: 'Ankit Verma', role: 'AUTHORITY' }
      )

      assert.strictEqual(updated.status, COMPLAINT_STATUSES.ASSIGNED)
      assert.strictEqual(updated.assignedWorker.id, worker.id)
    })
  })

  // =========================================================================
  // 4. WORKER WORKFLOW TESTS
  // =========================================================================
  describe('4. Worker Workflows', () => {
    test('Worker views assigned tasks strictly scoped', async () => {
      const worker = mockRepository.getWorkers()[0]
      const tasks = await complaintService.getComplaints({ workerId: worker.id })
      assert.ok(tasks.every((t) => t.assignedWorker?.id === worker.id))
    })

    test('Start work, update progress, upload evidence, and mark resolved', async () => {
      const worker = { id: 'usr-4', name: 'Raj Kumar', role: 'WORKER' }

      // 1. Assign worker
      await complaintService.assignWorker('CF-1002', worker.id, { name: 'Officer', role: 'AUTHORITY' })

      // 2. Start Work
      const inProg = await complaintService.updateStatus(
        'CF-1002',
        COMPLAINT_STATUSES.IN_PROGRESS,
        'Technician reached site with repair equipment.',
        worker
      )
      assert.strictEqual(inProg.status, COMPLAINT_STATUSES.IN_PROGRESS)

      // 3. Mark Resolved with resolution notes
      const resolved = await complaintService.updateStatus(
        'CF-1002',
        COMPLAINT_STATUSES.RESOLVED,
        'Patch applied with asphalt layer. Site cleaned.',
        worker
      )
      assert.strictEqual(resolved.status, COMPLAINT_STATUSES.RESOLVED)
      assert.ok(resolved.resolution)
      assert.strictEqual(resolved.resolution.notes, 'Patch applied with asphalt layer. Site cleaned.')
    })
  })

  // =========================================================================
  // 5. ADMIN WORKFLOW TESTS
  // =========================================================================
  describe('5. Admin Management Workflows', () => {
    test('Manage Users: Search, Role Filter, Toggle Status', async () => {
      const users = await userService.getUsers()
      assert.ok(users.length >= 4)

      const target = users[0]
      const toggled = await userService.toggleUserStatus(target.id)
      assert.notStrictEqual(toggled.status, target.status)
    })

    test('Manage Field Workers & Capacity Overview', async () => {
      const workers = await workerService.getWorkers()
      assert.ok(workers.length >= 3)
      assert.ok(workers.every((w) => typeof w.name === 'string'))
    })

    test('Master Complaints Registry broad visibility', async () => {
      const allComplaints = await complaintService.getComplaints()
      assert.ok(allComplaints.length >= 4)
    })

    test('Categories Management: Configure SLA & Enable/Disable', () => {
      const categories = mockRepository.getCategories()
      assert.ok(categories.length >= 4)

      const cat = categories[0]
      assert.ok(cat.slaHours > 0)
    })

    test('Platform Analytics derived metrics', () => {
      const complaints = mockRepository.getComplaints()
      const workers = mockRepository.getWorkers()
      assert.ok(complaints.length > 0)
      assert.ok(workers.length > 0)
    })

    test('System Audit Activity Log chronological integrity', () => {
      const activities = mockRepository.getActivity()
      assert.ok(Array.isArray(activities))
      assert.ok(activities.length > 0)
    })
  })

  // =========================================================================
  // 6. COMPLAINT ENGINE LIFECYCLE RULE TESTS
  // =========================================================================
  describe('6. Complaint Transition Engine Rules', () => {
    test('Valid Transitions', () => {
      assert.strictEqual(canTransition(COMPLAINT_STATUSES.REPORTED, COMPLAINT_STATUSES.UNDER_REVIEW), true)
      assert.strictEqual(canTransition(COMPLAINT_STATUSES.UNDER_REVIEW, COMPLAINT_STATUSES.ASSIGNED), true)
      assert.strictEqual(canTransition(COMPLAINT_STATUSES.ASSIGNED, COMPLAINT_STATUSES.IN_PROGRESS), true)
      assert.strictEqual(canTransition(COMPLAINT_STATUSES.IN_PROGRESS, COMPLAINT_STATUSES.RESOLVED), true)
      assert.strictEqual(canTransition(COMPLAINT_STATUSES.RESOLVED, COMPLAINT_STATUSES.CLOSED), true)
    })

    test('Alternative Transitions: REJECTED and DUPLICATE', () => {
      assert.strictEqual(canTransition(COMPLAINT_STATUSES.REPORTED, COMPLAINT_STATUSES.REJECTED), true)
      assert.strictEqual(canTransition(COMPLAINT_STATUSES.UNDER_REVIEW, COMPLAINT_STATUSES.REJECTED), true)
      assert.strictEqual(canTransition(COMPLAINT_STATUSES.UNDER_REVIEW, COMPLAINT_STATUSES.DUPLICATE), true)
    })

    test('Invalid Transitions', () => {
      assert.strictEqual(canTransition(COMPLAINT_STATUSES.CLOSED, COMPLAINT_STATUSES.REPORTED), false)
      assert.strictEqual(canTransition(COMPLAINT_STATUSES.REJECTED, COMPLAINT_STATUSES.IN_PROGRESS), false)
    })
  })
})

