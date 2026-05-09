const triggerModel = require('../models/trigger.model');
const workflowModel = require('../models/workflow.model');

// Create trigger
const createTrigger = async (workflowId, userId, data) => {
  // Verify user owns the workflow
  const wf = await workflowModel.getWorkflowById(workflowId);
  if (!wf) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }
  
  if (wf.user_id !== userId) {
    const err = new Error('Unauthorized: you do not own this workflow');
    err.statusCode = 403;
    throw err;
  }
  
  // Create trigger
  const trigger = await triggerModel.createTrigger(workflowId, data.triggerType, data);
  return trigger;
};

// List triggers for workflow
const listTriggers = async (workflowId, userId, options = {}) => {
  // Verify user owns the workflow
  const wf = await workflowModel.getWorkflowById(workflowId);
  if (!wf) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }
  
  if (wf.user_id !== userId) {
    const err = new Error('Unauthorized: you do not own this workflow');
    err.statusCode = 403;
    throw err;
  }
  
  return triggerModel.getTriggersByWorkflow(workflowId, options);
};

// Get trigger by ID
const getTrigger = async (triggerId, userId) => {
  const trigger = await triggerModel.getTriggerById(triggerId);
  if (!trigger) {
    const err = new Error('Trigger not found');
    err.statusCode = 404;
    throw err;
  }
  
  // Verify user owns the workflow
  const wf = await workflowModel.getWorkflowById(trigger.workflow_id);
  if (!wf || wf.user_id !== userId) {
    const err = new Error('Unauthorized');
    err.statusCode = 403;
    throw err;
  }
  
  return trigger;
};

// Update trigger
const updateTrigger = async (triggerId, userId, data) => {
  const trigger = await triggerModel.getTriggerById(triggerId);
  if (!trigger) {
    const err = new Error('Trigger not found');
    err.statusCode = 404;
    throw err;
  }
  
  // Verify user owns the workflow
  const wf = await workflowModel.getWorkflowById(trigger.workflow_id);
  if (!wf || wf.user_id !== userId) {
    const err = new Error('Unauthorized');
    err.statusCode = 403;
    throw err;
  }
  
  return triggerModel.updateTrigger(triggerId, data);
};

// Delete trigger
const deleteTrigger = async (triggerId, userId) => {
  const trigger = await triggerModel.getTriggerById(triggerId);
  if (!trigger) {
    const err = new Error('Trigger not found');
    err.statusCode = 404;
    throw err;
  }
  
  // Verify user owns the workflow
  const wf = await workflowModel.getWorkflowById(trigger.workflow_id);
  if (!wf || wf.user_id !== userId) {
    const err = new Error('Unauthorized');
    err.statusCode = 403;
    throw err;
  }
  
  return triggerModel.deleteTrigger(triggerId);
};

// Toggle trigger active status
const toggleTriggerActive = async (triggerId, userId, isActive) => {
  const trigger = await triggerModel.getTriggerById(triggerId);
  if (!trigger) {
    const err = new Error('Trigger not found');
    err.statusCode = 404;
    throw err;
  }
  
  // Verify user owns the workflow
  const wf = await workflowModel.getWorkflowById(trigger.workflow_id);
  if (!wf || wf.user_id !== userId) {
    const err = new Error('Unauthorized');
    err.statusCode = 403;
    throw err;
  }
  
  return triggerModel.toggleTriggerActive(triggerId, isActive);
};

module.exports = {
  createTrigger,
  listTriggers,
  getTrigger,
  updateTrigger,
  deleteTrigger,
  toggleTriggerActive,
};
