/**
 * Auth API Tests
 * Run these tests to verify authentication endpoints work correctly
 * Usage: npm test -- test/auth.test.js
 */

const request = require('supertest');
const app = require('../src/app');
const { query } = require('../src/db/pool');

describe('Authentication API', () => {
  let accessToken;
  let refreshToken;
  let userId;

  // Cleanup test user before tests
  beforeAll(async () => {
    try {
      await query('DELETE FROM users WHERE email = ?', ['test@example.com']);
      await query('DELETE FROM users WHERE username = ?', ['testuser']);
    } catch (err) {
      console.log('Cleanup error:', err.message);
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.user.username).toBe('testuser');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');

      // Store tokens for later tests
      accessToken = res.body.data.tokens.accessToken;
      refreshToken = res.body.data.tokens.refreshToken;
      userId = res.body.data.user.id;
    });

    it('should fail with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'anotheruser',
          password: 'TestPassword123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('User already exists');
    });

    it('should fail with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'weak@example.com',
          username: 'weakuser',
          password: 'weak',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('strength');
    });

    it('should fail with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          username: 'anotheruser',
          password: 'TestPassword123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should fail with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should fail with non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!',
        });

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      // Update tokens for subsequent tests
      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should fail with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.email).toBe('test@example.com');
      expect(res.body.data.username).toBe('testuser');
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('should fail without authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/profile');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should fail with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update profile successfully', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Profile',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.firstName).toBe('Updated');
      expect(res.body.data.lastName).toBe('Profile');
    });

    it('should fail without authorization', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .send({
          firstName: 'Updated',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'TestPassword123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });

    it('should fail with incorrect current password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'AnotherPassword789!',
          confirmPassword: 'AnotherPassword789!',
        });

      expect(res.status).toBe(401);
    });

    it('should fail with non-matching password confirmation', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'NewPassword456!',
          newPassword: 'AnotherPassword789!',
          confirmPassword: 'DifferentPassword!',
        });

      expect(res.status).toBe(400);
    });
  });

  // Cleanup after tests
  afterAll(async () => {
    try {
      await query('DELETE FROM users WHERE email = ?', ['test@example.com']);
    } catch (err) {
      console.log('Cleanup error:', err.message);
    }
  });
});
