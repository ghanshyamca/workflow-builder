const cron = require('node-cron');
const { stopScheduler, addTrigger, removeTrigger, reloadAllTriggers } = require('../src/workers/scheduler');

describe('Scheduler Worker', () => {
  afterEach(() => {
    // Clean up any lingering scheduler state
    stopScheduler();
  });

  it('validates cron expression', () => {
    const validExpressions = [
      '*/5 * * * *',      // Every 5 minutes
      '0 0 * * *',        // Daily at midnight
      '0 12 * * 1-5',     // Weekdays at noon
      '*/5 * * * * *',    // Every 5 seconds (6-field)
    ];

    for (const expr of validExpressions) {
      expect(cron.validate(expr)).toBe(true);
    }
  });

  it('rejects invalid cron expressions', () => {
    const invalidExpressions = [
      'not a cron',
      '99 99 99 99 99',
      'every five minutes',
    ];

    for (const expr of invalidExpressions) {
      expect(cron.validate(expr)).toBe(false);
    }
  });

  it('exports scheduler functions', () => {
    expect(typeof addTrigger).toBe('function');
    expect(typeof removeTrigger).toBe('function');
    expect(typeof reloadAllTriggers).toBe('function');
  });
});
