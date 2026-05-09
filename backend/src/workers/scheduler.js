const cron = require('node-cron');
const logger = require('../utils/logger');
const TriggerModel = require('../models/trigger.model');
const workflowService = require('../services/workflow.service');

let scheduledJobs = [];

const startScheduler = async () => {
  try {
    const triggers = await TriggerModel.getActiveScheduleTriggers();

    for (const t of triggers) {
      const expression = String(t.cron_expression || '').trim();
      const tz = t.timezone || 'UTC';
      if (!expression) continue;

      try {
        const job = cron.schedule(expression, async () => {
          try {
            logger.info('Cron trigger fired', { triggerId: t.id, workflowId: t.workflow_id });
            await workflowService.executeWorkflowViaSchedule(t.id);
          } catch (err) {
            logger.error('Scheduled trigger execution error', { triggerId: t.id, error: err.message });
          }
        }, { timezone: tz });

        scheduledJobs.push({ id: t.id, job });
        logger.info('Scheduled cron trigger', { triggerId: t.id, expression, timezone: tz });
      } catch (err) {
        logger.error('Failed to schedule trigger', { triggerId: t.id, expression, error: err.message });
      }
    }
  } catch (err) {
    logger.error('Failed to start scheduler', { error: err.message });
  }
};

const stopScheduler = () => {
  for (const s of scheduledJobs) {
    try {
      s.job.stop();
    } catch (e) {
      // ignore
    }
  }
  scheduledJobs = [];
};

// Add a single trigger (called when trigger is created/enabled)
const addTrigger = async (triggerId) => {
  try {
    const trigger = await TriggerModel.getTriggerById(triggerId);
    if (!trigger || !trigger.is_active || trigger.trigger_type !== 'schedule') {
      logger.warn('Trigger not found, inactive, or not a schedule trigger', { triggerId });
      return;
    }

    // Check if already scheduled
    if (scheduledJobs.find((s) => s.id === triggerId)) {
      logger.info('Trigger already scheduled', { triggerId });
      return;
    }

    const expression = String(trigger.cron_expression || '').trim();
    const tz = trigger.timezone || 'UTC';
    if (!expression) {
      logger.warn('No cron expression for trigger', { triggerId });
      return;
    }

    const job = cron.schedule(expression, async () => {
      try {
        logger.info('Cron trigger fired', { triggerId: trigger.id, workflowId: trigger.workflow_id });
        await workflowService.executeWorkflowViaSchedule(trigger.id);
      } catch (err) {
        logger.error('Scheduled trigger execution error', { triggerId: trigger.id, error: err.message });
      }
    }, { timezone: tz });

    scheduledJobs.push({ id: triggerId, job });
    logger.info('Added scheduled cron trigger', { triggerId, expression, timezone: tz });
  } catch (err) {
    logger.error('Failed to add trigger', { triggerId, error: err.message });
  }
};

// Remove a trigger (called when trigger is deleted/disabled)
const removeTrigger = (triggerId) => {
  const idx = scheduledJobs.findIndex((s) => s.id === triggerId);
  if (idx === -1) {
    logger.warn('Trigger not in scheduler', { triggerId });
    return;
  }

  try {
    scheduledJobs[idx].job.stop();
  } catch (e) {
    // ignore
  }

  scheduledJobs.splice(idx, 1);
  logger.info('Removed scheduled cron trigger', { triggerId });
};

// Reload all triggers (periodic refresh or on demand)
const reloadAllTriggers = async () => {
  stopScheduler();
  await startScheduler();
  logger.info('Reloaded all scheduled cron triggers');
};

// Start automatically
startScheduler();

process.on('SIGTERM', stopScheduler);
process.on('SIGINT', stopScheduler);

module.exports = {
  startScheduler,
  stopScheduler,
  addTrigger,
  removeTrigger,
  reloadAllTriggers,
};
