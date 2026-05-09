const { scheduleTriggerSchema } = require('../src/api/validators/trigger.validator');

describe('trigger schedule validator', () => {
  test('accepts standard 5-field cron expressions', () => {
    const { error } = scheduleTriggerSchema.validate({
      workflowId: 'a1f49c65-0328-4e4f-b202-157cc3e5d78c',
      triggerType: 'schedule',
      cronExpression: '*/5 * * * *',
      timezone: 'UTC',
    });

    expect(error).toBeUndefined();
  });

  test('accepts 6-field cron expressions with seconds', () => {
    const { error } = scheduleTriggerSchema.validate({
      workflowId: 'a1f49c65-0328-4e4f-b202-157cc3e5d78c',
      triggerType: 'schedule',
      cronExpression: '*/5 * * * * *',
      timezone: 'UTC',
    });

    expect(error).toBeUndefined();
  });

  test('accepts 7-field cron expressions with year', () => {
    const { error } = scheduleTriggerSchema.validate({
      workflowId: 'a1f49c65-0328-4e4f-b202-157cc3e5d78c',
      triggerType: 'schedule',
      cronExpression: '*/5 * * * * * *',
      timezone: 'UTC',
    });

    expect(error).toBeUndefined();
  });

  test('rejects truly invalid cron expressions', () => {
    const { error } = scheduleTriggerSchema.validate({
      workflowId: 'a1f49c65-0328-4e4f-b202-157cc3e5d78c',
      triggerType: 'schedule',
      cronExpression: 'not a valid cron',
      timezone: 'UTC',
    });

    expect(error).toBeDefined();
  });
});
