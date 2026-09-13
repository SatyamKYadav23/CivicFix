const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/db');
const { createTestUser } = require('../helpers/auth.helper');
const { cleanupUsers } = require('../helpers/cleanup.helper');

describe('Authentication API Integration Tests', () => {
  const createdUserIds = [];

  afterAll(async () => {
    await cleanupUsers(createdUserIds);
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new citizen with valid fields', async () => {
      const email = `reg_${Date.now()}@civicfix.test`;
      const res = await request(app)
        .post('/api/auth/register')
        .set('x-bypass-rate-limit', 'test-suite-internal')
        .send({
          name: 'Jane Citizen',
          email,
          password: 'Password123!',
          phone: '9123456780',
          address: '42 Blossom Grove',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.email).toBe(email);
      expect(res.body.data.user.role).toBe('CITIZEN');
      expect(res.body.data.user).not.toHaveProperty('password');

      createdUserIds.push(res.body.data.user.id);
    });

    it('should reject duplicate registration with HTTP 409 Conflict', async () => {
      const { user } = await createTestUser();
      createdUserIds.push(user.id);

      const res = await request(app)
        .post('/api/auth/register')
        .set('x-bypass-rate-limit', 'test-suite-internal')
        .send({
          name: 'Duplicate Citizen',
          email: user.email,
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should reject registration with invalid or missing fields (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('x-bypass-rate-limit', 'test-suite-internal')
        .send({
          name: '',
          email: 'not-an-email',
          password: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should sanitize role and prevent self-escalation to ADMIN', async () => {
      const email = `tamper_${Date.now()}@civicfix.test`;
      const res = await request(app)
        .post('/api/auth/register')
        .set('x-bypass-rate-limit', 'test-suite-internal')
        .send({
          name: 'Attacker User',
          email,
          password: 'Password123!',
          role: 'ADMIN',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('CITIZEN');
      createdUserIds.push(res.body.data.user.id);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully log in with valid credentials and return JWT', async () => {
      const { user, rawPassword } = await createTestUser();
      createdUserIds.push(user.id);

      const res = await request(app)
        .post('/api/auth/login')
        .set('x-bypass-rate-limit', 'test-suite-internal')
        .send({
          email: user.email,
          password: rawPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.id).toBe(user.id);
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should reject login with incorrect password (HTTP 401)', async () => {
      const { user } = await createTestUser();
      createdUserIds.push(user.id);

      const res = await request(app)
        .post('/api/auth/login')
        .set('x-bypass-rate-limit', 'test-suite-internal')
        .send({
          email: user.email,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('should reject login for non-existent email (HTTP 401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('x-bypass-rate-limit', 'test-suite-internal')
        .send({
          email: 'nonexistent_user@civicfix.test',
          password: 'SomePassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return authenticated user profile', async () => {
      const { user, headers } = await createTestUser();
      createdUserIds.push(user.id);

      const res = await request(app)
        .get('/api/auth/me')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(user.id);
      expect(res.body.data.email).toBe(user.email);
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should reject requests without authorization token (HTTP 401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('x-bypass-rate-limit', 'test-suite-internal');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject requests with invalid or tampered token (HTTP 401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set({
          Authorization: 'Bearer invalid.token.signature',
          'x-bypass-rate-limit': 'test-suite-internal',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

