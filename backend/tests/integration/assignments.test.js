const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/db');
const { createTestUser } = require('../helpers/auth.helper');
const { cleanupUsers, cleanupComplaints } = require('../helpers/cleanup.helper');

describe('Worker Assignments & Work Updates Integration Tests', () => {
  const createdUserIds = [];
  const createdComplaintIds = [];
  let citizenUser, authorityWater, workerAssigned, workerOther;
  let testComplaint;

  beforeAll(async () => {
    citizenUser = await createTestUser({ role: 'CITIZEN' });
    authorityWater = await createTestUser({ role: 'AUTHORITY', department: 'Water Supply & Sewerage' });
    workerAssigned = await createTestUser({ role: 'WORKER', department: 'Water Supply & Sewerage' });
    workerOther = await createTestUser({ role: 'WORKER', department: 'Water Supply & Sewerage' });

    createdUserIds.push(
      citizenUser.user.id,
      authorityWater.user.id,
      workerAssigned.user.id,
      workerOther.user.id
    );

    testComplaint = await prisma.complaint.create({
      data: {
        title: 'Burst Main Pipe near City Hall',
        description: 'Flooding street rapidly, immediate dispatch required.',
        category: 'WATER_SUPPLY',
        priority: 'CRITICAL',
        status: 'SUBMITTED',
        location: 'City Hall Square',
        citizenId: citizenUser.user.id,
      },
    });
    createdComplaintIds.push(testComplaint.id);
  });

  afterAll(async () => {
    await cleanupComplaints(createdComplaintIds);
    await cleanupUsers(createdUserIds);
  });

  describe('POST /api/authority/complaints/:id/assign', () => {
    it('should allow authority to assign an active worker to complaint within jurisdiction', async () => {
      const res = await request(app)
        .post(`/api/authority/complaints/${testComplaint.id}/assign`)
        .set(authorityWater.headers)
        .send({
          workerId: workerAssigned.user.id,
          instructions: 'Urgent: repair main valve and replace rusted pipe section.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ASSIGNED');
      expect(res.body.data.assignedWorkerId).toBe(workerAssigned.user.id);
    });

    it('should reject worker assignment from unauthorized citizen (HTTP 403)', async () => {
      const res = await request(app)
        .post(`/api/authority/complaints/${testComplaint.id}/assign`)
        .set(citizenUser.headers)
        .send({
          workerId: workerAssigned.user.id,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Worker Task Access & IDOR Scoping', () => {
    it('should allow assigned worker to view the task details (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/worker/complaints/${testComplaint.id}`)
        .set(workerAssigned.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testComplaint.id);
    });

    it('should prevent unassigned worker from viewing the task (HTTP 403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/worker/complaints/${testComplaint.id}`)
        .set(workerOther.headers);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should list task in assigned worker queue', async () => {
      const res = await request(app)
        .get('/api/worker/complaints')
        .set(workerAssigned.headers);

      expect(res.status).toBe(200);
      const complaints = res.body.data.complaints;
      expect(complaints.some((c) => c.id === testComplaint.id)).toBe(true);
    });

    it('should NOT list task in unassigned worker queue', async () => {
      const res = await request(app)
        .get('/api/worker/complaints')
        .set(workerOther.headers);

      expect(res.status).toBe(200);
      const complaints = res.body.data.complaints;
      expect(complaints.some((c) => c.id === testComplaint.id)).toBe(false);
    });
  });

  describe('Worker Progress & Work Logs', () => {
    it('should allow assigned worker to accept task and transition to IN_PROGRESS', async () => {
      const res = await request(app)
        .patch(`/api/worker/complaints/${testComplaint.id}/status`)
        .set(workerAssigned.headers)
        .send({
          status: 'IN_PROGRESS',
          notes: 'Technician arrived on site, isolated water valve.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    it('should reject status update from unassigned worker (HTTP 403)', async () => {
      const res = await request(app)
        .patch(`/api/worker/complaints/${testComplaint.id}/status`)
        .set(workerOther.headers)
        .send({
          status: 'IN_PROGRESS',
        });

      expect(res.status).toBe(403);
    });

    it('should allow assigned worker to log a work update checkpoint with materials used', async () => {
      const res = await request(app)
        .post(`/api/worker/complaints/${testComplaint.id}/update`)
        .set(workerAssigned.headers)
        .send({
          notes: 'Excavated road pavement; replaced 3 meters of 4-inch PVC pipe.',
          materialsUsed: '3m PVC pipe, 2 brass couplings, cement mix',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const updateData = res.body.data.update || res.body.data;
      expect(updateData.notes).toContain('Excavated road pavement');
    });
  });
});

