import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storage.js'
import {
  INITIAL_USERS,
  INITIAL_COMPLAINTS,
  INITIAL_WORKERS,
  INITIAL_AUTHORITIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_CATEGORIES,
  INITIAL_ACTIVITY,
} from '../mock/index.js'

const KEYS = {
  USERS: 'cf_users',
  COMPLAINTS: 'cf_complaints',
  WORKERS: 'cf_workers',
  AUTHORITIES: 'cf_authorities',
  NOTIFICATIONS: 'cf_notifications',
  CATEGORIES: 'cf_categories',
  ACTIVITY: 'cf_activity',
  SESSION: 'cf_session',
}

export class MockRepository {
  constructor() {
    this.ensureInitialized()
  }

  ensureInitialized() {
    const existingUsers = getStorageItem(KEYS.USERS)
    if (!existingUsers) {
      setStorageItem(KEYS.USERS, INITIAL_USERS)
    } else {
      // Merge any new initial users (e.g. newly added department authorities)
      const existingEmails = new Set(existingUsers.map((u) => u.email?.toLowerCase()))
      const missingUsers = INITIAL_USERS.filter((u) => !existingEmails.has(u.email?.toLowerCase()))
      if (missingUsers.length > 0) {
        setStorageItem(KEYS.USERS, [...existingUsers, ...missingUsers])
      }
    }
    if (!getStorageItem(KEYS.COMPLAINTS)) {
      setStorageItem(KEYS.COMPLAINTS, INITIAL_COMPLAINTS)
    }
    if (!getStorageItem(KEYS.WORKERS)) {
      setStorageItem(KEYS.WORKERS, INITIAL_WORKERS)
    }
    if (!getStorageItem(KEYS.AUTHORITIES)) {
      setStorageItem(KEYS.AUTHORITIES, INITIAL_AUTHORITIES)
    }
    if (!getStorageItem(KEYS.NOTIFICATIONS)) {
      setStorageItem(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS)
    }
    if (!getStorageItem(KEYS.CATEGORIES)) {
      setStorageItem(KEYS.CATEGORIES, INITIAL_CATEGORIES)
    }
    if (!getStorageItem(KEYS.ACTIVITY)) {
      setStorageItem(KEYS.ACTIVITY, INITIAL_ACTIVITY)
    }
  }

  // --- Users ---
  getUsers() {
    this.ensureInitialized()
    return getStorageItem(KEYS.USERS, INITIAL_USERS)
  }

  saveUsers(users) {
    setStorageItem(KEYS.USERS, users)
    return users
  }

  getUserById(id) {
    return this.getUsers().find((u) => u.id === id) || null
  }

  getUserByEmail(email) {
    if (!email) return null
    return this.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
  }

  createUser(userData) {
    const users = this.getUsers()
    const newUser = {
      id: `usr-${Date.now()}`,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      ...userData,
    }
    users.push(newUser)
    this.saveUsers(users)
    return newUser
  }

  createAuthority(authorityData) {
    const newAuthority = this.createUser({
      ...authorityData,
      role: 'AUTHORITY',
      assignedZones: authorityData.zone ? [authorityData.zone] : ['Central Ward'],
      activeCases: 0,
      resolvedCases: 0,
      avatar: authorityData.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    })

    // Also update authorities collection
    const authorities = this.getAuthorities()
    authorities.push(newAuthority)
    setStorageItem(KEYS.AUTHORITIES, authorities)
    return newAuthority
  }

  createWorker(workerData) {
    const newWorker = this.createUser({
      ...workerData,
      role: 'WORKER',
      assignedTasks: 0,
      completedTasks: 0,
      rating: 5.0,
      avatar: workerData.avatar || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80`,
    })

    // Also update workers collection
    const workers = this.getWorkers()
    workers.push(newWorker)
    setStorageItem(KEYS.WORKERS, workers)
    return newWorker
  }

  deleteUser(id) {
    let users = this.getUsers()
    users = users.filter((u) => u.id !== id)
    this.saveUsers(users)
    return true
  }

  updateUser(id, updates) {
    const users = this.getUsers()
    const index = users.findIndex((u) => u.id === id)
    if (index === -1) return null
    users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString() }
    this.saveUsers(users)
    return users[index]
  }

  // --- Complaints ---
  getComplaints() {
    this.ensureInitialized()
    return getStorageItem(KEYS.COMPLAINTS, INITIAL_COMPLAINTS)
  }

  saveComplaints(complaints) {
    setStorageItem(KEYS.COMPLAINTS, complaints)
    return complaints
  }

  getComplaintById(id) {
    return this.getComplaints().find((c) => c.id === id) || null
  }

  createComplaint(complaintData) {
    const complaints = this.getComplaints()
    const nextSeq = complaints.length + 1001
    const photos = complaintData.photos || complaintData.evidence || []
    const evidence = complaintData.evidence || complaintData.photos || []
    const newComplaint = {
      id: `CF-${nextSeq}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photos,
      evidence,
      timeline: [
        {
          id: `evt-${Date.now()}`,
          status: 'REPORTED',
          title: 'Complaint Reported',
          timestamp: new Date().toISOString(),
          actor: complaintData.citizenName || 'Citizen',
          notes: 'Report submitted via Citizen Portal.',
          evidence: photos,
          state: 'active',
        },
      ],
      ...complaintData,
    }
    complaints.unshift(newComplaint)
    this.saveComplaints(complaints)
    return newComplaint
  }

  updateComplaint(id, updates, timelineEntry = null) {
    const complaints = this.getComplaints()
    const index = complaints.findIndex((c) => c.id === id)
    if (index === -1) return null

    const existing = complaints[index]
    const timeline = existing.timeline || []

    if (timelineEntry) {
      timeline.push({
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        state: 'completed',
        ...timelineEntry,
      })
    }

    complaints[index] = {
      ...existing,
      ...updates,
      timeline,
      updatedAt: new Date().toISOString(),
    }
    this.saveComplaints(complaints)
    return complaints[index]
  }

  getUserByRole(role) {
    return this.getUsers().filter((u) => u.role === role)
  }


  getWorkers() {
    this.ensureInitialized()
    return getStorageItem(KEYS.WORKERS, INITIAL_WORKERS)
  }

  saveWorkers(workers) {
    setStorageItem(KEYS.WORKERS, workers)
    return workers
  }

  getWorkerById(id) {
    return this.getWorkers().find((w) => w.id === id) || null
  }

  // --- Authorities ---
  getAuthorities() {
    this.ensureInitialized()
    return getStorageItem(KEYS.AUTHORITIES, INITIAL_AUTHORITIES)
  }

  // --- Notifications ---
  getNotifications() {
    this.ensureInitialized()
    return getStorageItem(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS)
  }

  saveNotifications(notifications) {
    setStorageItem(KEYS.NOTIFICATIONS, notifications)
    return notifications
  }

  createNotification(notifData) {
    const notifs = this.getNotifications()
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      read: false,
      createdAt: new Date().toISOString(),
      ...notifData,
    }
    notifs.unshift(newNotif)
    this.saveNotifications(notifs)
    return newNotif
  }

  // --- Categories ---
  getCategories() {
    this.ensureInitialized()
    return getStorageItem(KEYS.CATEGORIES, INITIAL_CATEGORIES)
  }

  // --- Activity Log ---
  getActivity() {
    this.ensureInitialized()
    return getStorageItem(KEYS.ACTIVITY, INITIAL_ACTIVITY)
  }

  saveActivity(activity) {
    setStorageItem(KEYS.ACTIVITY, activity)
    return activity
  }

  logActivity(entry) {
    const activities = this.getActivity()
    const newEntry = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...entry,
    }
    activities.unshift(newEntry)
    this.saveActivity(activities)
    return newEntry
  }

  // --- Session ---
  getSession() {
    return getStorageItem(KEYS.SESSION, null)
  }

  saveSession(sessionData) {
    setStorageItem(KEYS.SESSION, sessionData)
    return sessionData
  }

  clearSession() {
    removeStorageItem(KEYS.SESSION)
  }

  // --- Aliases for compatibility ---
  addComplaint(data) {
    return this.createComplaint(data)
  }

  addNotification(data) {
    return this.createNotification(data)
  }

  addActivity(entry) {
    return this.logActivity(entry)
  }

  // --- Reset helper ---
  resetToMockData() {
    setStorageItem(KEYS.USERS, INITIAL_USERS)
    setStorageItem(KEYS.COMPLAINTS, INITIAL_COMPLAINTS)
    setStorageItem(KEYS.WORKERS, INITIAL_WORKERS)
    setStorageItem(KEYS.AUTHORITIES, INITIAL_AUTHORITIES)
    setStorageItem(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS)
    setStorageItem(KEYS.CATEGORIES, INITIAL_CATEGORIES)
    setStorageItem(KEYS.ACTIVITY, INITIAL_ACTIVITY)
    this.clearSession()
  }

  resetAll() {
    this.resetToMockData()
  }
}

export const mockRepository = new MockRepository()

