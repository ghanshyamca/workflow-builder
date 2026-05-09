const request = require('supertest');
const app = require('../src/app');
const { query } = require('../src/db/pool');

describe('Workflow API', () => {
  let accessToken;
  let userId;
  let workflowId;

  beforeAll(async () => {
    // ensure clean test user
    try {
      await query('DELETE FROM users WHERE email = ?', ['wf-test@example.com']);
    } catch (err) {
      // ignore
    }
  });

  it('registers and logs in a test user', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'wf-test@example.com',
        username: 'wftest',
        password: 'TestPassword123!',
      });

    expect([200, 201]).toContain(reg.status);
    expect(reg.body.status).toBeDefined();

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wf-test@example.com', password: 'TestPassword123!' });

    expect(login.status).toBe(200);
    expect(login.body.data).toHaveProperty('tokens');
    accessToken = login.body.data.tokens.accessToken;
    userId = login.body.data.user.id;
  });

  it('creates a workflow', async () => {
    const payload = {
      name: 'Test Workflow',
      description: 'Created by integration test',
      definition: { nodes: [], edges: [] },
    };

    const res = await request(app)
      .post('/api/workflows')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('id');
    workflowId = res.body.data.id;
  });

  it('lists workflows for the user', async () => {
    const res = await request(app)
      .get('/api/workflows')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('retrieves the created workflow', async () => {
    const res = await request(app)
      .get(`/api/workflows/${workflowId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(workflowId);
  });

  it('updates the workflow', async () => {
    const res = await request(app)
      .put(`/api/workflows/${workflowId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Updated Test Workflow' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Test Workflow');
  });

  it('publishes the workflow', async () => {
    const res = await request(app)
      .post(`/api/workflows/${workflowId}/publish`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('published');
  });

  it('deletes the workflow', async () => {
    const res = await request(app)
      .delete(`/api/workflows/${workflowId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  afterAll(async () => {
    try {
      await query('DELETE FROM users WHERE email = ?', ['wf-test@example.com']);
    } catch (err) {
      // ignore
    }
  });
});
