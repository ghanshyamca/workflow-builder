const request = require('supertest');
const app = require('../src/app');
const { query } = require('../src/db/pool');
const scheduler = require('../src/workers/scheduler');

describe('Schedule Trigger Integration', () => {
  let accessToken;
  let userId;
  let workflowId;
  let triggerId;

  beforeAll(async () => {
    // Clean test user
    try {
      await query('DELETE FROM users WHERE email = ?', ['schedule-test@example.com']);
    } catch (err) {
      // ignore
    }
  });

  it('registers and logs in a test user', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'schedule-test@example.com',
        username: 'scheduletest',
        password: 'TestPassword123!',
      });

    expect([200, 201]).toContain(reg.status);

    const login = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'schedule-test@example.com',
        password: 'TestPassword123!',
      });

    expect(login.status).toBe(200);
    expect(login.body.data).toHaveProperty('tokens');
    accessToken = login.body.data.tokens.accessToken;
    userId = login.body.data.user.id;
  });

  it('creates a workflow', async () => {
    const payload = {
      name: 'Schedule Test Workflow',
      description: 'For testing schedule triggers',
      definition: { nodes: [], edges: [] },
    };

    const res = await request(app)
      .post('/api/workflows')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    workflowId = res.body.data.id;
  });

  it('creates a schedule trigger', async () => {
    const payload = {
      workflowId,
      triggerType: 'schedule',
      cronExpression: '*/5 * * * *', // Every 5 minutes
      timezone: 'UTC',
      isActive: true,
    };

    const res = await request(app)
      .post('/api/triggers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.trigger_type).toBe('schedule');
    expect(res.body.data.cron_expression).toBe('*/5 * * * *');
    expect(res.body.data.is_active).toBe(true);
    triggerId = res.body.data.id;
  });

  it('lists triggers for the workflow', async () => {
    const res = await request(app)
      .get(`/api/triggers?workflowId=${workflowId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    const created = res.body.data.find((t) => t.id === triggerId);
    expect(created).toBeDefined();
    expect(created.trigger_type).toBe('schedule');
  });

  it('gets a single trigger', async () => {
    const res = await request(app)
      .get(`/api/triggers/${triggerId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(triggerId);
    expect(res.body.data.cron_expression).toBe('*/5 * * * *');
  });

  it('disables the trigger (removes from scheduler)', async () => {
    const res = await request(app)
      .post(`/api/triggers/${triggerId}/toggle`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(false);
  });

  it('re-enables the trigger (adds to scheduler)', async () => {
    const res = await request(app)
      .post(`/api/triggers/${triggerId}/toggle`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ isActive: true });

    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(true);
  });

  it('updates the trigger cron expression', async () => {
    const res = await request(app)
      .put(`/api/triggers/${triggerId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ cronExpression: '0 0 * * *' }); // Daily at midnight

    expect(res.status).toBe(200);
    expect(res.body.data.cron_expression).toBe('0 0 * * *');
  });

  it('deletes the trigger', async () => {
    const res = await request(app)
      .delete(`/api/triggers/${triggerId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
  });

  it('verifies trigger was deleted', async () => {
    const res = await request(app)
      .get(`/api/triggers/${triggerId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(403); // Forbidden since trigger no longer exists
  });

  afterAll(async () => {
    // Clean up test user
    try {
      await query('DELETE FROM users WHERE email = ?', ['schedule-test@example.com']);
    } catch (err) {
      // ignore
    }
  });
});
