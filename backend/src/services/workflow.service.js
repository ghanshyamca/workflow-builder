const Workflow = require('../models/workflow.model');
const logger = require('../utils/logger');
const workflowRunModel = require('../models/workflowRun.model');
const { assertWorkflowOwnership } = require('./workflowAccess');
const {
  validateConditionExpression,
} = require('./execution/nodeRegistry');
const {
  executeWorkflowRun,
  getWorkflowNodesAndEdges,
} = require('./execution/workflowEngine');

const createWorkflow = async (userId, payload) => {
  const workflow = await Workflow.createWorkflow(userId, payload.name, payload.description, payload.definition);
  logger.info('Workflow created', { userId, workflowId: workflow.id });
  return workflow;
};

const listWorkflows = async (userId, { limit = 50, offset = 0 } = {}) => {
  return await Workflow.getWorkflowsByUser(userId, limit, offset);
};

const getWorkflow = async (id) => {
  const wf = await Workflow.getWorkflowById(id);
  if (!wf) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }
  return wf;
};

const updateWorkflow = async (id, userId, updates) => {
  await assertWorkflowOwnership(id, userId, 'Forbidden');
  return await Workflow.updateWorkflow(id, updates);
};

const deleteWorkflow = async (id, userId) => {
  await assertWorkflowOwnership(id, userId, 'Forbidden');
  return await Workflow.deleteWorkflow(id);
};

const publishWorkflow = async (id, userId) => {
  const existing = await assertWorkflowOwnership(id, userId, 'Forbidden');

  // Validate condition node expressions before publishing to avoid executing unsafe code at runtime
  const definition = existing.definition || {};
  const nodes = Array.isArray(definition.nodes) ? definition.nodes : [];
  for (const n of nodes) {
    const type = String(n?.data?.nodeType || n?.type || '').toLowerCase();
    if (!type.includes('condition')) continue;

    const expr = String((n?.data && n.data.expression) || '').trim();
    if (!expr) continue;

    try {
      validateConditionExpression(expr);
    } catch (e) {
      const err = new Error(`Invalid condition expression in node ${n.id}: ${e.message}`);
      err.statusCode = 400;
      throw err;
    }
  }

  return await Workflow.publishWorkflow(id);
};

const executeWorkflow = async (id, userId, executionData = {}) => {
  const existing = await assertWorkflowOwnership(id, userId, 'Forbidden');

  const { nodes } = getWorkflowNodesAndEdges(existing);

  if (nodes.length === 0) {
    const err = new Error('Workflow has no nodes to execute');
    err.statusCode = 400;
    throw err;
  }

  const run = await workflowRunModel.createWorkflowRun(id, userId, null, executionData || {});

  return executeWorkflowRun({
    workflow: existing,
    runId: run.id,
    executionData,
    loggerContext: { userId },
  });
};

const pauseWorkflowRun = async (runId, userId) => {
  const run = await workflowRunModel.getWorkflowRunById(runId);
  if (!run) {
    const err = new Error('Run not found');
    err.statusCode = 404;
    throw err;
  }

  // Verify user owns the workflow
  await assertWorkflowOwnership(run.workflow_id, userId, 'Forbidden');

  if (run.status !== 'running') {
    const err = new Error('Can only pause running workflows');
    err.statusCode = 400;
    throw err;
  }

  return await workflowRunModel.updateWorkflowRunStatus(runId, 'paused');
};

const resumeWorkflowRun = async (runId, userId) => {
  const run = await workflowRunModel.getWorkflowRunById(runId);
  if (!run) {
    const err = new Error('Run not found');
    err.statusCode = 404;
    throw err;
  }

  // Verify user owns the workflow
  await assertWorkflowOwnership(run.workflow_id, userId, 'Forbidden');

  if (run.status !== 'paused') {
    const err = new Error('Can only resume paused workflows');
    err.statusCode = 400;
    throw err;
  }

  // Resume execution asynchronously
  await workflowRunModel.updateWorkflowRunStatus(runId, 'running');
  
  // Re-execute from current state
  setImmediate(() => {
    resumeExecutionFromRun(runId, run.workflow_id, run.execution_data).catch((err) => {
      logger.error('Resume execution failed', { runId, error: err.message });
      workflowRunModel.completeWorkflowRun(runId, 'failed', `Resume failed: ${err.message}`);
    });
  });

  return run;
};

const resumeExecutionFromRun = async (runId, workflowId, handoffData) => {
  // Rehydrate run state and resume execution from where it left off.
  const WorkflowModel = Workflow; // alias

  const run = await workflowRunModel.getWorkflowRunById(runId);
  if (!run) throw new Error('Run not found');

  const workflow = await WorkflowModel.getWorkflowById(workflowId);
  if (!workflow) throw new Error('Workflow not found');

  // Get all node executions for this run
  const nodeExecutionModel = require('../models/nodeExecution.model');
  const nodeExecutions = await nodeExecutionModel.getNodeExecutionsByRun(runId);

  // Build maps of last status and outputs per node
  const lastByNode = new Map();
  for (const ne of nodeExecutions) {
    lastByNode.set(ne.node_id, ne);
  }

  const completed = new Set();
  const initialContext = { runId, workflowId: workflow.id, startedAt: run.start_time || new Date().toISOString(), nodes: {} };
  for (const [nodeId, ne] of lastByNode.entries()) {
    if (String(ne.status).toLowerCase() === 'completed') {
      completed.add(nodeId);
      try {
        if (ne.output_data) initialContext.nodes[nodeId] = typeof ne.output_data === 'string' ? JSON.parse(ne.output_data) : ne.output_data;
      } catch (e) {
        initialContext.nodes[nodeId] = ne.output_data;
      }
    }
  }

  // Determine initial payload: prefer handoffData, then run.execution_data
  const initialPayload = (handoffData && (handoffData.payload || handoffData)) || (run.execution_data && (run.execution_data.payload || run.execution_data)) || {};

  // Call engine with initial visited/context so it won't re-run completed nodes
  return executeWorkflowRun({
    workflow,
    runId,
    executionData: handoffData || run.execution_data || {},
    loggerContext: {},
    initialVisited: completed,
    initialPayload,
    initialContext,
  });
};

// Webhook execution
const executeWorkflowViaWebhook = async (workflowId, secretKey, payload) => {
  const TriggerModel = require('../models/trigger.model');
  
  const workflow = await Workflow.getWorkflowById(workflowId);
  if (!workflow) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }

  const triggers = await TriggerModel.getTriggersByWorkflow(workflowId);
  const webhookTrigger = triggers.find((t) => t.trigger_type === 'webhook' && t.webhook_secret === secretKey && t.is_active);

  if (!webhookTrigger) {
    const err = new Error('Invalid webhook secret');
    err.statusCode = 401;
    throw err;
  }

  // Execute workflow with webhook payload
  const run = await workflowRunModel.createWorkflowRun(workflowId, workflow.user_id, webhookTrigger.id, payload || {});
  
  // Update last triggered time
  await TriggerModel.updateLastTriggeredAt(webhookTrigger.id);

  // Execute asynchronously
  setImmediate(() => {
    executeWorkflowInternal(workflowId, workflow.user_id, run.id, payload).catch((err) => {
      logger.error('Webhook execution failed', { workflowId, runId: run.id, error: err.message });
    });
  });

  return { message: 'Workflow execution started', run };
};

// Schedule trigger execution (triggered by scheduler)
const executeWorkflowViaSchedule = async (triggerId) => {
  const TriggerModel = require('../models/trigger.model');

  const trigger = await TriggerModel.getTriggerById(triggerId);
  if (!trigger || !trigger.is_active || trigger.trigger_type !== 'schedule') {
    const err = new Error('Trigger not found or not active');
    err.statusCode = 404;
    throw err;
  }

  const workflow = await Workflow.getWorkflowById(trigger.workflow_id);
  if (!workflow) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }

  // Create run attached to this trigger
  const run = await workflowRunModel.createWorkflowRun(workflow.id, workflow.user_id, trigger.id, {});

  // Update last triggered time
  await TriggerModel.updateLastTriggeredAt(trigger.id);

  // Execute asynchronously
  setImmediate(() => {
    executeWorkflowInternal(workflow.id, workflow.user_id, run.id, {}).catch((err) => {
      logger.error('Scheduled execution failed', { workflowId: workflow.id, runId: run.id, error: err.message });
    });
  });

  return { message: 'Scheduled workflow execution started', run };
};

// Internal execution helper (doesn't create new run)
const executeWorkflowInternal = async (workflowId, userId, runId, executionData = {}) => {
  const existing = await Workflow.getWorkflowById(workflowId);
  if (!existing) throw new Error('Workflow not found');

  const { nodes } = getWorkflowNodesAndEdges(existing);

  if (nodes.length === 0) throw new Error('Workflow has no nodes to execute');

  return executeWorkflowRun({
    workflow: existing,
    runId,
    executionData,
    loggerContext: { userId },
  });
};

module.exports = {
  createWorkflow,
  listWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  publishWorkflow,
  executeWorkflow,
  pauseWorkflowRun,
  resumeWorkflowRun,
  executeWorkflowViaWebhook,
};
// Export schedule executor
module.exports.executeWorkflowViaSchedule = executeWorkflowViaSchedule;
