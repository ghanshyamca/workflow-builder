const Workflow = require('../models/workflow.model');
const logger = require('../utils/logger');
const axios = require('axios');
const workflowRunModel = require('../models/workflowRun.model');
const nodeExecutionModel = require('../models/nodeExecution.model');

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
  const existing = await Workflow.getWorkflowById(id);
  if (!existing) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }
  if (existing.user_id !== userId) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  return await Workflow.updateWorkflow(id, updates);
};

const deleteWorkflow = async (id, userId) => {
  const existing = await Workflow.getWorkflowById(id);
  if (!existing) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }
  if (existing.user_id !== userId) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  return await Workflow.deleteWorkflow(id);
};

const publishWorkflow = async (id, userId) => {
  const existing = await Workflow.getWorkflowById(id);
  if (!existing) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }
  if (existing.user_id !== userId) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  return await Workflow.publishWorkflow(id);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getNodeType = (node) => String(node?.data?.nodeType || node?.type || '').toLowerCase();

const resolveValue = (value, payload, context) => {
  if (typeof value !== 'string') return value;

  return value.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expr) => {
    const path = expr.trim();
    if (path.startsWith('payload.')) {
      const keys = path.slice('payload.'.length).split('.');
      return keys.reduce((acc, key) => (acc == null ? '' : acc[key]), payload) ?? '';
    }
    if (path.startsWith('context.')) {
      const keys = path.slice('context.'.length).split('.');
      return keys.reduce((acc, key) => (acc == null ? '' : acc[key]), context) ?? '';
    }
    return '';
  });
};

// Exponential backoff sleep with jitter
const exponentialBackoff = async (attempt) => {
  const baseDelay = 1000; // 1 second
  const delay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.1 * delay;
  await sleep(delay + jitter);
};

// Execute node with automatic retries
const executeNodeWithRetry = async (node, payload, context, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await executeNode(node, payload, context);
    } catch (err) {
      lastError = err;
      
      // Don't retry condition/delay/notify nodes unless HTTP retryable
      const type = getNodeType(node);
      const isRetryable = type.includes('http') && (
        err.code === 'ECONNREFUSED' ||
        err.code === 'ECONNRESET' ||
        err.code === 'ETIMEDOUT' ||
        err.message.includes('timeout') ||
        err.message.includes('ENOTFOUND') ||
        (err.response?.status >= 500)
      );
      
      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }
      
      logger.warn(`Node retry: ${node.id} (attempt ${attempt}/${maxRetries})`, {
        error: err.message,
        nodeType: type,
      });
      
      await exponentialBackoff(attempt);
    }
  }
  
  throw lastError;
};

const executeNode = async (node, payload, context) => {
  const type = getNodeType(node);
  const config = node?.data || {};

  if (type.includes('http')) {
    const method = (config.method || 'GET').toUpperCase();
    const url = resolveValue(config.url || '', payload, context);
    const headers = config.headers && typeof config.headers === 'object' ? config.headers : {};
    const requestData = config.body && typeof config.body === 'object' ? config.body : undefined;

    if (!url) {
      throw new Error('HTTP Request node requires a URL');
    }

    const response = await axios({
      method,
      url,
      headers,
      data: requestData,
      timeout: parseInt(process.env.HTTP_NODE_TIMEOUT_MS || '15000', 10),
      validateStatus: () => true,
    });

    const output = {
      status: response.status,
      headers: response.headers,
      data: response.data,
    };

    return { output, payload: response.data };
  }

  if (type.includes('condition')) {
    const expression = String(config.expression || 'true');
    let result = false;

    try {
      const evaluator = new Function('payload', 'context', `return (${expression});`);
      result = !!evaluator(payload, context);
    } catch (err) {
      throw new Error(`Condition evaluation failed: ${err.message}`);
    }

    return { output: { expression, result }, payload };
  }

  if (type.includes('delay')) {
    const delayMs = Number(config.delayMs || config.ms || 1000);
    const clampedDelayMs = Math.max(0, Math.min(delayMs, 60000));
    await sleep(clampedDelayMs);
    return { output: { delayMs: clampedDelayMs }, payload };
  }

  if (type.includes('notify')) {
    const provider = String(config.provider || config.channel || 'slack').toLowerCase();
    const webhookUrl = config.slackWebhookUrl || config.webhookUrl || config.url;
    const message = resolveValue(config.message || config.text || 'Workflow notification', payload, context);

    if (provider === 'slack') {
      if (!webhookUrl) {
        throw new Error('Slack notify node requires webhookUrl or slackWebhookUrl');
      }

      const response = await axios.post(webhookUrl, { text: message }, {
        timeout: parseInt(process.env.SLACK_NOTIFY_TIMEOUT_MS || '10000', 10),
        validateStatus: () => true,
      });

      if (response.status >= 400) {
        throw new Error(`Slack notification failed with status ${response.status}`);
      }

      return { output: { provider: 'slack', sent: true, status: response.status, message }, payload };
    }

    throw new Error(`Unsupported notify provider: ${provider}`);
  }

  // Unknown node type: pass-through so workflows can still continue.
  return { output: { skipped: true, reason: `Unsupported node type: ${type}` }, payload };
};

const chooseNextNodeIds = (node, allEdges, nodeResult) => {
  const outgoing = allEdges.filter((e) => e.source === node.id);
  if (outgoing.length === 0) return [];

  const type = getNodeType(node);
  if (!type.includes('condition')) {
    return outgoing.map((e) => e.target);
  }

  const result = !!nodeResult?.output?.result;
  const trueRegex = /true|yes|pass|success|then/i;
  const falseRegex = /false|no|fail|else/i;

  const matched = outgoing.find((e) => {
    const label = String(e.label || '');
    return result ? trueRegex.test(label) : falseRegex.test(label);
  });

  if (matched) return [matched.target];

  if (!result) {
    const err = new Error('Condition not met');
    err.statusCode = 400;
    throw err;
  }

  if (outgoing.length === 1) return [outgoing[0].target];
  return [outgoing[0].target];
};

const executeWorkflow = async (id, userId, executionData = {}) => {
  const existing = await Workflow.getWorkflowById(id);
  if (!existing) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }
  if (existing.user_id !== userId) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  const definition = existing.definition || {};
  const nodes = Array.isArray(definition.nodes) ? definition.nodes : [];
  const edges = Array.isArray(definition.edges) ? definition.edges : [];

  if (nodes.length === 0) {
    const err = new Error('Workflow has no nodes to execute');
    err.statusCode = 400;
    throw err;
  }

  const run = await workflowRunModel.createWorkflowRun(id, userId, null, executionData || {});

  const incomingCount = new Map(nodes.map((n) => [n.id, 0]));
  edges.forEach((e) => {
    incomingCount.set(e.target, (incomingCount.get(e.target) || 0) + 1);
  });

  const initialQueue = nodes
    .filter((n) => (incomingCount.get(n.id) || 0) === 0)
    .map((n) => n.id);

  const queue = initialQueue.length > 0 ? [...initialQueue] : [nodes[0].id];
  const visited = new Set();

  let payload = executionData?.payload || executionData || {};
  const context = {
    runId: run.id,
    workflowId: id,
    startedAt: new Date().toISOString(),
    nodes: {},
  };

  try {
    while (queue.length > 0) {
      // Check if execution was paused
      const currentRun = await workflowRunModel.getWorkflowRunById(run.id);
      if (currentRun.status === 'paused') {
        break;
      }

      const nodeId = queue.shift();
      if (!nodeId || visited.has(nodeId)) continue;

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) continue;

      visited.add(nodeId);

      const nodeExecution = await nodeExecutionModel.createNodeExecution(
        run.id,
        id,
        nodeId,
        {
          name: node?.data?.label || node?.data?.nodeType || 'Node',
          type: node?.data?.nodeType || 'unknown',
          inputData: { payload, context, config: node?.data || {} },
        }
      );

      await nodeExecutionModel.startNodeExecution(nodeExecution.id);

      try {
        const maxRetries = node?.data?.maxRetries || 3;
        const result = await executeNodeWithRetry(node, payload, context, maxRetries);
        payload = result.payload;
        context.nodes[nodeId] = result.output;

        await nodeExecutionModel.updateNodeExecution(nodeExecution.id, 'completed', result.output, null);

        const nextNodeIds = chooseNextNodeIds(node, edges, result);
        nextNodeIds.forEach((nextId) => {
          if (!visited.has(nextId)) queue.push(nextId);
        });
      } catch (nodeErr) {
        await nodeExecutionModel.updateNodeExecution(nodeExecution.id, 'failed', null, nodeErr.message);
        throw nodeErr;
      }
    }

    // Check if execution was paused or completed
    const finalRun = await workflowRunModel.getWorkflowRunById(run.id);
    if (finalRun.status === 'paused') {
      await workflowRunModel.updateWorkflowRunStatus(run.id, 'paused', null);
    } else {
      const completedRun = await workflowRunModel.completeWorkflowRun(run.id, 'completed', null);
      const runWithNodes = await workflowRunModel.getWorkflowRunWithNodes(completedRun.id);
      return runWithNodes;
    }
    
    const pausedRun = await workflowRunModel.getWorkflowRunWithNodes(run.id);
    return pausedRun;
  } catch (err) {
    await workflowRunModel.completeWorkflowRun(run.id, 'failed', err.message);
    const failedRun = await workflowRunModel.getWorkflowRunWithNodes(run.id);
    logger.error('Workflow execution failed', {
      workflowId: id,
      runId: run.id,
      error: err.message,
    });
    return failedRun;
  }
};

const pauseWorkflowRun = async (runId, userId) => {
  const run = await workflowRunModel.getWorkflowRunById(runId);
  if (!run) {
    const err = new Error('Run not found');
    err.statusCode = 404;
    throw err;
  }

  // Verify user owns the workflow
  const workflow = await Workflow.getWorkflowById(run.workflow_id);
  if (workflow.user_id !== userId) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

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
  const workflow = await Workflow.getWorkflowById(run.workflow_id);
  if (workflow.user_id !== userId) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  if (run.status !== 'paused') {
    const err = new Error('Can only resume paused workflows');
    err.statusCode = 400;
    throw err;
  }

  // Resume execution asynchronously
  await workflowRunModel.updateWorkflowRunStatus(runId, 'running');
  
  // Re-execute from current state
  const definition = run.execution_data?.definition || {};
  const nodes = Array.isArray(definition.nodes) ? definition.nodes : [];
  const edges = Array.isArray(definition.edges) ? definition.edges : [];
  
  setImmediate(() => {
    resumeExecutionFromRun(runId, run.workflow_id, nodes, edges, run.execution_data).catch((err) => {
      logger.error('Resume execution failed', { runId, error: err.message });
      workflowRunModel.completeWorkflowRun(runId, 'failed', `Resume failed: ${err.message}`);
    });
  });

  return run;
};

const resumeExecutionFromRun = async (runId, workflowId, nodes, edges, handoffData) => {
  // Implementation for resume continued below
  const runWithNodes = await workflowRunModel.getWorkflowRunWithNodes(runId);
  return runWithNodes;
};

// Trigger-related functions
const createTrigger = async (workflowId, userId, triggerData) => {
  const TriggerModel = require('../models/trigger.model');
  
  const workflow = await Workflow.getWorkflowById(workflowId);
  if (!workflow) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }
  if (workflow.user_id !== userId) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  const trigger = await TriggerModel.createTrigger(workflowId, triggerData.type, triggerData);
  logger.info('Trigger created', { workflowId, triggerId: trigger.id, type: triggerData.type });
  return trigger;
};

const getTriggers = async (workflowId, userId) => {
  const TriggerModel = require('../models/trigger.model');
  
  const workflow = await Workflow.getWorkflowById(workflowId);
  if (!workflow) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }
  if (workflow.user_id !== userId) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  return await TriggerModel.getTriggersByWorkflow(workflowId);
};

const getTriggerById = async (triggerId, userId) => {
  const TriggerModel = require('../models/trigger.model');
  
  const trigger = await TriggerModel.getTriggerById(triggerId);
  if (!trigger) {
    const err = new Error('Trigger not found');
    err.statusCode = 404;
    throw err;
  }

  const workflow = await Workflow.getWorkflowById(trigger.workflow_id);
  if (workflow.user_id !== userId) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  return trigger;
};

const updateTrigger = async (triggerId, userId, updates) => {
  const TriggerModel = require('../models/trigger.model');
  
  const trigger = await TriggerModel.getTriggerById(triggerId);
  if (!trigger) {
    const err = new Error('Trigger not found');
    err.statusCode = 404;
    throw err;
  }

  const workflow = await Workflow.getWorkflowById(trigger.workflow_id);
  if (workflow.user_id !== userId) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  return await TriggerModel.updateTrigger(triggerId, updates);
};

const deleteTrigger = async (triggerId, userId) => {
  const TriggerModel = require('../models/trigger.model');
  
  const trigger = await TriggerModel.getTriggerById(triggerId);
  if (!trigger) {
    const err = new Error('Trigger not found');
    err.statusCode = 404;
    throw err;
  }

  const workflow = await Workflow.getWorkflowById(trigger.workflow_id);
  if (workflow.user_id !== userId) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  return await TriggerModel.deleteTrigger(triggerId);
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

// Internal execution helper (doesn't create new run)
const executeWorkflowInternal = async (workflowId, userId, runId, executionData = {}) => {
  const existing = await Workflow.getWorkflowById(workflowId);
  if (!existing) throw new Error('Workflow not found');

  const definition = existing.definition || {};
  const nodes = Array.isArray(definition.nodes) ? definition.nodes : [];
  const edges = Array.isArray(definition.edges) ? definition.edges : [];

  if (nodes.length === 0) throw new Error('Workflow has no nodes to execute');

  let payload = executionData?.payload || executionData || {};
  const context = {
    runId,
    workflowId: workflowId,
    startedAt: new Date().toISOString(),
    nodes: {},
  };

  try {
    const incomingCount = new Map(nodes.map((n) => [n.id, 0]));
    edges.forEach((e) => {
      incomingCount.set(e.target, (incomingCount.get(e.target) || 0) + 1);
    });

    const initialQueue = nodes
      .filter((n) => (incomingCount.get(n.id) || 0) === 0)
      .map((n) => n.id);

    const queue = initialQueue.length > 0 ? [...initialQueue] : [nodes[0].id];
    const visited = new Set();

    while (queue.length > 0) {
      const nodeId = queue.shift();
      if (!nodeId || visited.has(nodeId)) continue;

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) continue;

      visited.add(nodeId);

      const nodeExecution = await nodeExecutionModel.createNodeExecution(
        runId,
        workflowId,
        nodeId,
        {
          name: node?.data?.label || node?.data?.nodeType || 'Node',
          type: node?.data?.nodeType || 'unknown',
          inputData: { payload, context, config: node?.data || {} },
        }
      );

      await nodeExecutionModel.startNodeExecution(nodeExecution.id);

      try {
        const maxRetries = node?.data?.maxRetries || 3;
        const result = await executeNodeWithRetry(node, payload, context, maxRetries);
        payload = result.payload;
        context.nodes[nodeId] = result.output;

        await nodeExecutionModel.updateNodeExecution(nodeExecution.id, 'completed', result.output, null);

        const nextNodeIds = chooseNextNodeIds(node, edges, result);
        nextNodeIds.forEach((nextId) => {
          if (!visited.has(nextId)) queue.push(nextId);
        });
      } catch (nodeErr) {
        await nodeExecutionModel.updateNodeExecution(nodeExecution.id, 'failed', null, nodeErr.message);
        throw nodeErr;
      }
    }

    await workflowRunModel.completeWorkflowRun(runId, 'completed', null);
  } catch (err) {
    await workflowRunModel.completeWorkflowRun(runId, 'failed', err.message);
    logger.error('Internal workflow execution failed', { workflowId, runId, error: err.message });
  }
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
  createTrigger,
  getTriggers,
  getTriggerById,
  updateTrigger,
  deleteTrigger,
  executeWorkflowViaWebhook,
};
