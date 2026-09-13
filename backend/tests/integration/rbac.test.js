const request = require('supertest');
const app = require('../../src/app');
const { createTestUser } = require('../helpers/auth.helper');
const { cleanupUsers } = require('../helpers/cleanup.helper');

describe('Authorization & RBAC Integration Tests', () => {
  const createdUserIds = [];
  let citizenA, citizenB, workerUser, authorityUser, adminUser;

  beforeAll(async () => {
    citizenA = await createTestUser({ role: 'CITIZEN' });
    citizenB = await createTestUser({ role: 'CITIZEN' });
    workerUser = await createTestUser({ role: 'WORKER' });
    authorityUser = await createTestUser({ role: 'AUTHORITY' });
    adminUser = await createTestUser({ role: 'ADMIN' });

    createdUserIds.push(
      citizenA.user.id,
      citizenB.user.id,
      workerUser.user.id,
      authorityUser.user.id,
      adminUser.user.id
    );
  });

  afterAll(async () => {
    await cleanupUsers(createdUserIds);
  });

  describe('Citizen Access Restrictions', () => {
    it('Citizen can access their own profile (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/users/${citizenA.user.id}`)
        .set(citizenA.headers);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(citizenA.user.id);
    });

    it('Citizen is blocked from accessing another citizen profile (HTTP 403 IDOR Protection)', async () => {
      const res = await request(app)
        .get(`/api/users/${citizenB.user.id}`)
        .set(citizenA.headers);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Citizen is blocked from calling administrative endpoints (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set(citizenA.headers);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Citizen is blocked from calling authority endpoints (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/authority/complaints')
        .set(citizenA.headers);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Worker Access Restrictions', () => {
    it('Worker can access worker dashboard endpoints (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/worker/complaints')
        .set(workerUser.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Worker is blocked from calling administrative endpoints (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set(workerUser.headers);

      expect(res.status).toBe(403);
    });

    it('Worker cannot view another user profile (HTTP 403)', async () => {
      const res = await request(app)
        .get(`/api/users/${citizenA.user.id}`)
        .set(workerUser.headers);

      expect(res.status).toBe(403);
    });
  });

  describe('Authority Access Permissions & Boundaries', () => {
    it('Authority can access authority triage complaints (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/authority/complaints')
        .set(authorityUser.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Authority can view user profiles for operational context (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/users/${citizenA.user.id}`)
        .set(authorityUser.headers);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(citizenA.user.id);
    });

    it('Authority is blocked from admin-only endpoints (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set(authorityUser.headers);

      expect(res.status).toBe(403);
    });
  });

  describe('Admin Universal Access', () => {
    it('Admin can access system stats (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set(adminUser.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Admin can inspect any user profile (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/users/${citizenA.user.id}`)
        .set(adminUser.headers);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(citizenA.user.id);
    });
  });
});

