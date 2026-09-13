const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/db');
const { createTestUser } = require('../helpers/auth.helper');
const { cleanupUsers, cleanupComplaints } = require('../helpers/cleanup.helper');

describe('Notifications API Integration Tests', () => {
  const createdUserIds = [];
  const createdComplaintIds = [];
  let citizenUser, workerUser, authorityUser;

  beforeAll(async () => {
    citizenUser = await createTestUser({ role: 'CITIZEN' });
    workerUser = await createTestUser({ role: 'WORKER' });
    authorityUser = await createTestUser({ role: 'AUTHORITY' });

    createdUserIds.push(citizenUser.user.id, workerUser.user.id, authorityUser.user.id);
  });

  afterAll(async () => {
    await cleanupComplaints(createdComplaintIds);
    await cleanupUsers(createdUserIds);
  });

  describe('Automatic Notification Creation', () => {
    it('should create a notification for citizen when a complaint is reported', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set(citizenUser.headers)
        .send({
          title: 'Notification Trigger Complaint',
          description: 'Testing automatic notification dispatch',
          category: 'SANITATION_WASTE',
          priority: 'MEDIUM',
          location: 'Waste Depot 3',
        });

      expect(res.status).toBe(201);
      createdComplaintIds.push(res.body.data.id);

      // Check notification feed
      const notifRes = await request(app)
        .get('/api/notifications')
        .set(citizenUser.headers);

      expect(notifRes.status).toBe(200);
      expect(notifRes.body.success).toBe(true);
      expect(notifRes.body.data.notifications.length).toBeGreaterThanOrEqual(1);

      const createdNotif = notifRes.body.data.notifications.find(
        (n) => n.complaintId === res.body.data.id
      );
      expect(createdNotif).toBeDefined();
      expect(createdNotif.read).toBe(false);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('should mark a specific notification as read', async () => {
      // Seed an unread notification directly
      const notification = await prisma.notification.create({
        data: {
          userId: citizenUser.user.id,
          title: 'Task Dispatched',
          message: 'Technician is en route to inspect your issue.',
          type: 'WORKER_ASSIGNED',
          read: false,
        },
      });

      const res = await request(app)
        .patch(`/api/notifications/${notification.id}/read`)
        .set(citizenUser.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.read).toBe(true);

      const dbCheck = await prisma.notification.findUnique({ where: { id: notification.id } });
      expect(dbCheck.read).toBe(true);
    });

    it('should reject marking another user notification as read (HTTP 403 / 404)', async () => {
      const foreignNotif = await prisma.notification.create({
        data: {
          userId: workerUser.user.id,
          title: 'Worker Private Alert',
          message: 'Private assignment alert',
          type: 'COMPLAINT_ASSIGNED',
          read: false,
        },
      });

      const res = await request(app)
        .patch(`/api/notifications/${foreignNotif.id}/read`)
        .set(citizenUser.headers);

      expect([403, 404]).toContain(res.status);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it('should mark all unread notifications as read for authenticated user', async () => {
      await prisma.notification.createMany({
        data: [
          {
            userId: workerUser.user.id,
            title: 'Batch Notice 1',
            message: 'First unread item',
            type: 'COMPLAINT_ASSIGNED',
            read: false,
          },
          {
            userId: workerUser.user.id,
            title: 'Batch Notice 2',
            message: 'Second unread item',
            type: 'STATUS_CHANGED',
            read: false,
          },
        ],
      });

      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set(workerUser.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const unreadCount = await prisma.notification.count({
        where: { userId: workerUser.user.id, read: false },
      });
      expect(unreadCount).toBe(0);
    });
  });
});

