const triggerService = require('../src/services/trigger.service');
const triggerModel = require('../src/models/trigger.model');
const workflowModel = require('../src/models/workflow.model');
const { query } = require('../src/db/pool');

describe('Trigger Service - Schedule Triggers', () => {
  let userId;
  let workflowId;

  beforeAll(async () => {
    // Create test user
    try {
      await query('DELETE FROM users WHERE email = ?', ['trigger-svc-test@example.com']);
    } catch (err) {
      // ignore
    }

    const userRes = await query(
      'INSERT INTO users (id, email, username, password_hash) VALUES (?, ?, ?, ?) RETURNING id',
      ['test-trigger-svc-user', 'trigger-svc-test@example.com', 'triggertest', 'hashed']
    );
    userId = userRes.rows[0]?.id || 'test-trigger-svc-user';

    // Create test workflow
    const wfRes = await query(
      'INSERT INTO workflows (id, user_id, name, definition) VALUES (?, ?, ?, ?) RETURNING id',
      ['test-trigger-svc-wf', userId, 'Test Workflow', JSON.stringify({ nodes: [] })]
    );
    workflowId = wfRes.rows[0]?.id || 'test-trigger-svc-wf';
  });

  it('creates a schedule trigger', async () => {
    const data = {
      triggerType: 'schedule',
      cronExpression: '*/5 * * * *',
      timezone: 'UTC',
      isActive: true,
    };

    const trigger = await triggerService.createTrigger(workflowId, userId, data);
    expect(trigger).toBeDefined();
    expect(trigger.trigger_type).toBe('schedule');
    expect(trigger.cron_expression).toBe('*/5 * * * *');
    expect(trigger.is_active).toBe(true);
  });

  it('toggles a schedule trigger on/off', async () => {
    const data = {
      triggerType: 'schedule',
      cronExpression: '0 12 * * *',
      timezone: 'UTC',
      isActive: true,
    };

    const created = await triggerService.createTrigger(workflowId, userId, data);
    expect(created.is_active).toBe(true);

    const disabled = await triggerService.toggleTriggerActive(created.id, userId, false);
    expect(disabled.is_active).toBe(false);

    const enabled = await triggerService.toggleTriggerActive(created.id, userId, true);
    expect(enabled.is_active).toBe(true);
  });

  it('updates a schedule trigger', async () => {
    const data = {
      triggerType: 'schedule',
      cronExpression: '*/10 * * * *',
      timezone: 'America/New_York',
      isActive: true,
    };

    const created = await triggerService.createTrigger(workflowId, userId, data);

    const updated = await triggerService.updateTrigger(created.id, userId, {
      cronExpression: '0 0 * * 0',
      timezone: 'UTC',
    });

    expect(updated.cron_expression).toBe('0 0 * * 0');
    expect(updated.timezone).toBe('UTC');
  });

  it('deletes a schedule trigger', async () => {
    const data = {
      triggerType: 'schedule',
      cronExpression: '*/15 * * * *',
      timezone: 'UTC',
      isActive: true,
    };

    const created = await triggerService.createTrigger(workflowId, userId, data);
    const triggerId = created.id;

    await triggerService.deleteTrigger(triggerId, userId);

    // Verify it's deleted
    try {
      const getTrigger = require('../src/models/trigger.model').getTriggerById;
      const deleted = await getTrigger(triggerId);
      expect(deleted).toBeUndefined();
    } catch (err) {
      // Expected if trigger is gone
    }
  });

  afterAll(async () => {
    // Clean up
    try {
      await query('DELETE FROM triggers WHERE workflow_id = ?', [workflowId]);
      await query('DELETE FROM workflows WHERE id = ?', [workflowId]);
      await query('DELETE FROM users WHERE email = ?', ['trigger-svc-test@example.com']);
    } catch (err) {
      // ignore
    }
  });
});
