const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/db');
const { createTestUser } = require('../helpers/auth.helper');
const { cleanupUsers, cleanupComplaints } = require('../helpers/cleanup.helper');

describe('Complaints API Integration Tests', () => {
  const createdUserIds = [];
  const createdComplaintIds = [];
  let citizenA, citizenB, adminUser;

  beforeAll(async () => {
    citizenA = await createTestUser({ role: 'CITIZEN' });
    citizenB = await createTestUser({ role: 'CITIZEN' });
    adminUser = await createTestUser({ role: 'ADMIN' });

    createdUserIds.push(citizenA.user.id, citizenB.user.id, adminUser.user.id);
  });

  afterAll(async () => {
    await cleanupComplaints(createdComplaintIds);
    await cleanupUsers(createdUserIds);
  });

  describe('POST /api/complaints', () => {
    it('should allow a citizen to report a new complaint', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set(citizenA.headers)
        .send({
          title: 'Damaged Pothole on Market Street',
          description: 'Large pothole causing vehicle tire damage near the intersection.',
          category: 'ROADS_POTHOLES',
          priority: 'HIGH',
          location: 'Market St & 4th Ave',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toBe('SUBMITTED');
      expect(res.body.data.citizenId).toBe(citizenA.user.id);

      createdComplaintIds.push(res.body.data.id);
    });

    it('should reject complaint creation with missing required fields (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set(citizenA.headers)
        .send({
          title: 'Too short',
          // missing description, location, category
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/complaints/:id', () => {
    let testComplaint;

    beforeAll(async () => {
      testComplaint = await prisma.complaint.create({
        data: {
          title: 'Broken Street Light Test',
          description: 'Street light blinking and dark all night',
          category: 'STREET_LIGHTS',
          priority: 'MEDIUM',
          status: 'SUBMITTED',
          location: 'Corner of 7th and Oak',
          citizenId: citizenA.user.id,
        },
      });
      createdComplaintIds.push(testComplaint.id);
    });

    it('should allow owner citizen to view complaint details (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/complaints/${testComplaint.id}`)
        .set(citizenA.headers);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testComplaint.id);
      expect(res.body.data.title).toBe(testComplaint.title);
    });

    it('should prevent another citizen from viewing the complaint (HTTP 403 IDOR)', async () => {
      const res = await request(app)
        .get(`/api/complaints/${testComplaint.id}`)
        .set(citizenB.headers);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to view any complaint (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/complaints/${testComplaint.id}`)
        .set(adminUser.headers);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testComplaint.id);
    });

    it('should return 404 for non-existent complaint ID', async () => {
      const res = await request(app)
        .get('/api/complaints/non-existent-uuid-123')
        .set(adminUser.headers);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/complaints/:id', () => {
    let mutableComplaint;

    beforeAll(async () => {
      mutableComplaint = await prisma.complaint.create({
        data: {
          title: 'Water Leak Initial',
          description: 'Small pipe leak on sidewalk',
          category: 'WATER_SUPPLY',
          status: 'SUBMITTED',
          location: 'Pine St 101',
          citizenId: citizenA.user.id,
        },
      });
      createdComplaintIds.push(mutableComplaint.id);
    });

    it('should allow citizen to update complaint description while in SUBMITTED status', async () => {
      const res = await request(app)
        .put(`/api/complaints/${mutableComplaint.id}`)
        .set(citizenA.headers)
        .send({
          description: 'Updated: Water leak has enlarged significantly overnight.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toContain('Updated: Water leak has enlarged');
    });

    it('should prevent another citizen from updating the complaint (HTTP 403)', async () => {
      const res = await request(app)
        .put(`/api/complaints/${mutableComplaint.id}`)
        .set(citizenB.headers)
        .send({
          title: 'Hacked Title',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/complaints/:id', () => {
    it('should allow citizen owner to cancel/delete their own SUBMITTED complaint', async () => {
      const cancelComplaint = await prisma.complaint.create({
        data: {
          title: 'Mistaken Report',
          description: 'Reported by error, problem resolved itself',
          category: 'OTHER',
          status: 'SUBMITTED',
          location: 'Nowhere',
          citizenId: citizenA.user.id,
        },
      });

      const res = await request(app)
        .delete(`/api/complaints/${cancelComplaint.id}`)
        .set(citizenA.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await prisma.complaint.findUnique({ where: { id: cancelComplaint.id } });
      expect(check).toBeNull();
    });

    it('should prevent citizen from deleting another citizen complaint (HTTP 403)', async () => {
      const protectedComplaint = await prisma.complaint.create({
        data: {
          title: 'Protected Complaint',
          description: 'Should not be deletable by Citizen B',
          category: 'OTHER',
          status: 'SUBMITTED',
          location: 'Private Rd',
          citizenId: citizenA.user.id,
        },
      });
      createdComplaintIds.push(protectedComplaint.id);

      const res = await request(app)
        .delete(`/api/complaints/${protectedComplaint.id}`)
        .set(citizenB.headers);

      expect(res.status).toBe(403);
    });
  });

  describe('Filtering & Pagination (GET /api/complaints)', () => {
    beforeAll(async () => {
      // Seed a few complaints for pagination testing
      for (let i = 1; i <= 5; i++) {
        const c = await prisma.complaint.create({
          data: {
            title: `Batch Complaint ${i}`,
            description: `Testing pagination batch item ${i}`,
            category: i % 2 === 0 ? 'ROADS_POTHOLES' : 'DRAINAGE_SEWAGE',
            priority: i === 1 ? 'CRITICAL' : 'LOW',
            status: 'SUBMITTED',
            location: `Zone ${i}`,
            citizenId: citizenA.user.id,
          },
        });
        createdComplaintIds.push(c.id);
      }
    });

    it('should scope listing to authenticated citizen and support pagination', async () => {
      const res = await request(app)
        .get('/api/complaints?page=1&limit=2')
        .set(citizenA.headers);

      expect(res.status).toBe(200);
      expect(res.body.data.complaints.length).toBeLessThanOrEqual(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(5);
    });

    it('should filter complaints by category', async () => {
      const res = await request(app)
        .get('/api/complaints?category=ROADS_POTHOLES')
        .set(citizenA.headers);

      expect(res.status).toBe(200);
      const complaints = res.body.data.complaints;
      complaints.forEach((c) => {
        expect(c.category).toBe('ROADS_POTHOLES');
      });
    });

    it('should filter complaints by priority', async () => {
      const res = await request(app)
        .get('/api/complaints?priority=CRITICAL')
        .set(citizenA.headers);

      expect(res.status).toBe(200);
      const complaints = res.body.data.complaints;
      complaints.forEach((c) => {
        expect(c.priority).toBe('CRITICAL');
      });
    });
  });
});

