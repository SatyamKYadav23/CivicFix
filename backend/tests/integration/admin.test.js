const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/db');
const { createTestUser } = require('../helpers/auth.helper');
const { cleanupUsers, cleanupComplaints } = require('../helpers/cleanup.helper');

describe('Admin Module Integration Tests', () => {
  const createdUserIds = [];
  const createdComplaintIds = [];
  let adminUser, citizenUser, targetUser;

  beforeAll(async () => {
    adminUser = await createTestUser({ role: 'ADMIN' });
    citizenUser = await createTestUser({ role: 'CITIZEN' });
    targetUser = await createTestUser({ role: 'CITIZEN', status: 'ACTIVE' });

    createdUserIds.push(adminUser.user.id, citizenUser.user.id, targetUser.user.id);
  });

  afterAll(async () => {
    await cleanupComplaints(createdComplaintIds);
    await cleanupUsers(createdUserIds);
  });

  describe('Admin Access Control', () => {
    it('should reject non-admin users attempting to access admin endpoints (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set(citizenUser.headers);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('User Management', () => {
    it('Admin can list users with pagination and role filtering', async () => {
      const res = await request(app)
        .get('/api/admin/users?role=CITIZEN&limit=5')
        .set(adminUser.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toBeDefined();
      expect(res.body.pagination).toBeDefined();

      const users = res.body.data.users;
      expect(users.every((u) => u.role === 'CITIZEN')).toBe(true);
      // Ensure passwords are never leaked in administrative roster
      expect(users.every((u) => !u.password)).toBe(true);
    });

    it('Admin can deactivate a user account', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${targetUser.user.id}/status`)
        .set(adminUser.headers)
        .send({
          status: 'INACTIVE',
          reason: 'Terms of service violation',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('INACTIVE');

      const dbUser = await prisma.user.findUnique({ where: { id: targetUser.user.id } });
      expect(dbUser.status).toBe('INACTIVE');
    });

    it('Admin can reactivate user and update their role', async () => {
      // 1. Reactivate
      await request(app)
        .patch(`/api/admin/users/${targetUser.user.id}/status`)
        .set(adminUser.headers)
        .send({ status: 'ACTIVE' });

      // 2. Promote to worker
      const res = await request(app)
        .patch(`/api/admin/users/${targetUser.user.id}/role`)
        .set(adminUser.headers)
        .send({
          role: 'WORKER',
          department: 'Sanitation & Solid Waste',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('WORKER');
      expect(res.body.data.department).toBe('Sanitation & Solid Waste');
    });
  });

  describe('Complaint Management & Administrative Overrides', () => {
    let adminComplaint;

    beforeAll(async () => {
      adminComplaint = await prisma.complaint.create({
        data: {
          title: 'Admin Override Test Complaint',
          description: 'Testing administrative overrides',
          category: 'PARKS_PUBLIC_SPACES',
          priority: 'LOW',
          status: 'SUBMITTED',
          location: 'Central Plaza Park',
          citizenId: citizenUser.user.id,
        },
      });
      createdComplaintIds.push(adminComplaint.id);
    });

    it('Admin can view all complaints across departments', async () => {
      const res = await request(app)
        .get('/api/admin/complaints?category=PARKS_PUBLIC_SPACES')
        .set(adminUser.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.complaints).toBeDefined();
    });

    it('Admin can override complaint priority directly', async () => {
      const res = await request(app)
        .patch(`/api/admin/complaints/${adminComplaint.id}/priority`)
        .set(adminUser.headers)
        .send({
          priority: 'CRITICAL',
          reason: 'Escalated due to impending city festival event.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.priority).toBe('CRITICAL');

      const dbCheck = await prisma.complaint.findUnique({ where: { id: adminComplaint.id } });
      expect(dbCheck.priority).toBe('CRITICAL');
    });

    it('Admin can administratively override complaint status', async () => {
      const res = await request(app)
        .patch(`/api/admin/complaints/${adminComplaint.id}/status`)
        .set(adminUser.headers)
        .send({
          status: 'UNDER_REVIEW',
          notes: 'Administrative triage review override.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('UNDER_REVIEW');
    });

    it('Admin can inspect system audit logs', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?limit=5')
        .set(adminUser.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
    });
  });
});

