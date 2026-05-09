const Workflow = require('../models/workflow.model');
const triggerModel = require('../models/trigger.model');

const getWorkflowOrThrow = async (workflowId) => {
  const workflow = await Workflow.getWorkflowById(workflowId);
  if (!workflow) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }

  return workflow;
};

const assertWorkflowOwnership = async (workflowId, userId, message = 'Forbidden') => {
  const workflow = await getWorkflowOrThrow(workflowId);

  if (workflow.user_id !== userId) {
    const err = new Error(message);
    err.statusCode = 403;
    throw err;
  }

  return workflow;
};

const getTriggerOrThrow = async (triggerId) => {
  const trigger = await triggerModel.getTriggerById(triggerId);
  if (!trigger) {
    const err = new Error('Trigger not found');
    err.statusCode = 404;
    throw err;
  }

  return trigger;
};

const assertTriggerOwnership = async (triggerId, userId, message = 'Unauthorized') => {
  const trigger = await getTriggerOrThrow(triggerId);
  const workflow = await getWorkflowOrThrow(trigger.workflow_id);

  if (workflow.user_id !== userId) {
    const err = new Error(message);
    err.statusCode = 403;
    throw err;
  }

  return { trigger, workflow };
};

module.exports = {
  getWorkflowOrThrow,
  assertWorkflowOwnership,
  getTriggerOrThrow,
  assertTriggerOwnership,
};