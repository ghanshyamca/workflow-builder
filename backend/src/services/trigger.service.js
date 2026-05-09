const triggerModel = require('../models/trigger.model');
const {
  assertWorkflowOwnership,
  assertTriggerOwnership,
} = require('./workflowAccess');

// Lazy-load scheduler (only in non-test environments)
let scheduler = null;
const getScheduler = () => {
  if (scheduler) return scheduler;
  try {
    scheduler = require('../workers/scheduler');
  } catch (e) {
    // Scheduler may not be available in test environment
  }
  return scheduler;
};

// Create trigger
const createTrigger = async (workflowId, userId, data) => {
  await assertWorkflowOwnership(workflowId, userId, 'Unauthorized: you do not own this workflow');
  
  // Create trigger
  const trigger = await triggerModel.createTrigger(workflowId, data.triggerType, data);
  
  // If it's a schedule trigger, add to scheduler
  if (trigger.trigger_type === 'schedule' && trigger.is_active) {
    const sched = getScheduler();
    if (sched && sched.addTrigger) {
      sched.addTrigger(trigger.id).catch((err) => {
        console.error('Failed to add trigger to scheduler', { triggerId: trigger.id, error: err.message });
      });
    }
  }
  
  return trigger;
};

// List triggers for workflow
const listTriggers = async (workflowId, userId, options = {}) => {
  await assertWorkflowOwnership(workflowId, userId, 'Unauthorized: you do not own this workflow');
  return triggerModel.getTriggersByWorkflow(workflowId, options);
};

// Get trigger by ID
const getTrigger = async (triggerId, userId) => {
  const { trigger } = await assertTriggerOwnership(triggerId, userId, 'Unauthorized');
  return trigger;
};

// Update trigger
const updateTrigger = async (triggerId, userId, data) => {
  const existing = (await assertTriggerOwnership(triggerId, userId, 'Unauthorized')).trigger;
  const updated = await triggerModel.updateTrigger(triggerId, data);
  
  // Handle schedule trigger updates in scheduler
  if (updated.trigger_type === 'schedule') {
    const sched = getScheduler();
    if (sched) {
      const wasActive = existing.is_active;
      const isNowActive = updated.is_active;
      
      // If cron expression changed, reload trigger in scheduler
      if (data.cronExpression && data.cronExpression !== existing.cron_expression && isNowActive) {
        if (sched.removeTrigger) sched.removeTrigger(triggerId);
        if (sched.addTrigger) sched.addTrigger(triggerId).catch((err) => console.error('Failed to update trigger in scheduler', { error: err.message }));
      }
    }
  }
  
  return updated;
};

// Delete trigger
const deleteTrigger = async (triggerId, userId) => {
  const existing = (await assertTriggerOwnership(triggerId, userId, 'Unauthorized')).trigger;
  await triggerModel.deleteTrigger(triggerId);
  
  // Remove from scheduler if it was a schedule trigger
  if (existing.trigger_type === 'schedule') {
    const sched = getScheduler();
    if (sched && sched.removeTrigger) {
      sched.removeTrigger(triggerId);
    }
  }
};

// Toggle trigger active status
const toggleTriggerActive = async (triggerId, userId, isActive) => {
  const existing = (await assertTriggerOwnership(triggerId, userId, 'Unauthorized')).trigger;
  const updated = await triggerModel.toggleTriggerActive(triggerId, isActive);
  
  // Update scheduler for schedule triggers
  if (updated.trigger_type === 'schedule') {
    const sched = getScheduler();
    if (sched) {
      if (isActive && !existing.is_active) {
        // Trigger was disabled, now enabled -> add to scheduler
        if (sched.addTrigger) {
          sched.addTrigger(triggerId).catch((err) => console.error('Failed to add trigger to scheduler', { error: err.message }));
        }
      } else if (!isActive && existing.is_active) {
        // Trigger was enabled, now disabled -> remove from scheduler
        if (sched.removeTrigger) {
          sched.removeTrigger(triggerId);
        }
      }
    }
  }
  
  return updated;
};

module.exports = {
  createTrigger,
  listTriggers,
  getTrigger,
  updateTrigger,
  deleteTrigger,
  toggleTriggerActive,
};
