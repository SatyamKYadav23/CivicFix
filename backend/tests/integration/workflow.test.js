const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/db');
const { createTestUser } = require('../helpers/auth.helper');
const { cleanupUsers, cleanupComplaints } = require('../helpers/cleanup.helper');

describe('Complaint Status Workflow & State Machine Integration Tests', () => {
  const createdUserIds = [];
  const createdComplaintIds = [];
  let citizenUser, authorityUser, workerUser, adminUser;
  let testComplaint;

  beforeAll(async () => {
    citizenUser = await createTestUser({ role: 'CITIZEN' });
    authorityUser = await createTestUser({ role: 'AUTHORITY', department: 'Water Supply & Sewerage' });
    workerUser = await createTestUser({ role: 'WORKER', department: 'Water Supply & Sewerage' });
    adminUser = await createTestUser({ role: 'ADMIN' });

    createdUserIds.push(
      citizenUser.user.id,
      authorityUser.user.id,
      workerUser.user.id,
      adminUser.user.id
    );

    testComplaint = await prisma.complaint.create({
      data: {
        title: 'Workflow End-to-End Pipeline Complaint',
        description: 'Complete lifecycle test from submission to closure.',
        category: 'WATER_SUPPLY',
        status: 'SUBMITTED',
        location: 'Pipeline Sector 12',
        citizenId: citizenUser.user.id,
      },
    });
    createdComplaintIds.push(testComplaint.id);
  });

  afterAll(async () => {
    await cleanupComplaints(createdComplaintIds);
    await cleanupUsers(createdUserIds);
  });

  describe('Valid Lifecycle Transitions', () => {
    it('1. Authority transitions SUBMITTED -> UNDER_REVIEW', async () => {
      const res = await request(app)
        .patch(`/api/authority/complaints/${testComplaint.id}/status`)
        .set(authorityUser.headers)
        .send({
          status: 'UNDER_REVIEW',
          notes: 'Authority reviewed and confirmed legitimacy of report.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('UNDER_REVIEW');
    });

    it('2. Authority assigns worker: UNDER_REVIEW -> ASSIGNED', async () => {
      const res = await request(app)
        .post(`/api/authority/complaints/${testComplaint.id}/assign`)
        .set(authorityUser.headers)
        .send({
          workerId: workerUser.user.id,
          instructions: 'Perform physical inspection and repair pipeline.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ASSIGNED');
      expect(res.body.data.assignedWorkerId).toBe(workerUser.user.id);
    });

    it('3. Worker starts task: ASSIGNED -> IN_PROGRESS', async () => {
      const res = await request(app)
        .patch(`/api/worker/complaints/${testComplaint.id}/status`)
        .set(workerUser.headers)
        .send({
          status: 'IN_PROGRESS',
          notes: 'Technician on site, starting excavation.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    it('4. Worker completes work: IN_PROGRESS -> RESOLUTION_SUBMITTED', async () => {
      const res = await request(app)
        .patch(`/api/worker/complaints/${testComplaint.id}/status`)
        .set(workerUser.headers)
        .send({
          status: 'RESOLUTION_SUBMITTED',
          notes: 'Replacement complete, pressure tested successfully.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('RESOLUTION_SUBMITTED');
    });

    it('5. Authority approves resolution: RESOLUTION_SUBMITTED -> RESOLVED', async () => {
      const res = await request(app)
        .patch(`/api/authority/complaints/${testComplaint.id}/status`)
        .set(authorityUser.headers)
        .send({
          status: 'RESOLVED',
          notes: 'Verified field repairs; complaint marked as resolved.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('RESOLVED');
      expect(res.body.data.resolvedAt).toBeDefined();
    });

    it('6. Citizen provides feedback rating: RESOLVED -> CLOSED', async () => {
      const res = await request(app)
        .post(`/api/complaints/${testComplaint.id}/feedback`)
        .set(citizenUser.headers)
        .send({
          rating: 5,
          comment: 'Outstanding repair, quick turnaround!',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CLOSED');
      expect(res.body.data.feedback.rating).toBe(5);
    });
  });

  describe('Invalid & Unauthorized Transitions', () => {
    it('should reject illegal jumps (e.g. SUBMITTED -> RESOLVED directly by citizen)', async () => {
      const invalidComplaint = await prisma.complaint.create({
        data: {
          title: 'Illegal Jump Test',
          description: 'Testing illegal jump rejection',
          category: 'WATER_SUPPLY',
          status: 'SUBMITTED',
          location: 'Test Rd',
          citizenId: citizenUser.user.id,
        },
      });
      createdComplaintIds.push(invalidComplaint.id);

      const res = await request(app)
        .put(`/api/complaints/${invalidComplaint.id}`)
        .set(citizenUser.headers)
        .send({
          status: 'RESOLVED',
        });

      expect([400, 403]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should prevent feedback submission on non-resolved complaints', async () => {
      const pendingComplaint = await prisma.complaint.create({
        data: {
          title: 'Early Feedback Test',
          description: 'Cannot rate until resolved',
          category: 'WATER_SUPPLY',
          status: 'IN_PROGRESS',
          location: 'Test Rd',
          citizenId: citizenUser.user.id,
        },
      });
      createdComplaintIds.push(pendingComplaint.id);

      const res = await request(app)
        .post(`/api/complaints/${pendingComplaint.id}/feedback`)
        .set(citizenUser.headers)
        .send({
          rating: 4,
          comment: 'Trying to rate early',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Audit Timeline Verification', () => {
    it('should record chronological history events for each transition', async () => {
      const res = await request(app)
        .get(`/api/complaints/${testComplaint.id}/history`)
        .set(citizenUser.headers);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('timeline');
      expect(Array.isArray(res.body.data.timeline)).toBe(true);
      expect(res.body.data.timeline.length).toBeGreaterThanOrEqual(5);

      // Verify that actor information is populated
      const hasActors = res.body.data.timeline.every((item) => Boolean(item.actor));
      expect(hasActors).toBe(true);
    });
  });
});

