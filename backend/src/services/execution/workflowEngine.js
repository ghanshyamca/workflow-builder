const workflowRunModel = require('../../models/workflowRun.model');
const nodeExecutionModel = require('../../models/nodeExecution.model');
const logger = require('../../utils/logger');
const {
  executeNode,
  chooseNextNodeIds,
} = require('./nodeRegistry');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getWorkflowDefinition = (workflow) => workflow?.definition || {};

const getWorkflowNodesAndEdges = (workflow) => {
  const definition = getWorkflowDefinition(workflow);
  return {
    nodes: Array.isArray(definition.nodes) ? definition.nodes : [],
    edges: Array.isArray(definition.edges) ? definition.edges : [],
  };
};

const buildInitialQueue = (nodes, edges, visited = new Set()) => {
  const incomingCount = new Map(nodes.map((n) => [n.id, 0]));
  const predecessors = new Map();

  edges.forEach((edge) => {
    incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
    if (!predecessors.has(edge.target)) predecessors.set(edge.target, []);
    predecessors.get(edge.target).push(edge.source);
  });

  const initialQueue = nodes
    .filter((node) => {
      const preds = predecessors.get(node.id) || [];
      if (preds.length === 0) return true;
      return preds.every((p) => visited.has(p));
    })
    .map((node) => node.id);

  return initialQueue.length > 0 ? [...initialQueue] : nodes.length > 0 ? [nodes[0].id] : [];
};

const exponentialBackoff = async (attempt) => {
  const baseDelay = 1000;
  const delay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.1 * delay;
  await sleep(delay + jitter);
};

const executeNodeWithRetry = async (node, payload, context, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await executeNode(node, payload, context);
    } catch (err) {
      lastError = err;

      const type = String(node?.data?.nodeType || node?.type || '').toLowerCase();
      const isRetryable = type.includes('http') && (
        err.code === 'ECONNREFUSED' ||
        err.code === 'ECONNRESET' ||
        err.code === 'ETIMEDOUT' ||
        String(err.message || '').includes('timeout') ||
        String(err.message || '').includes('ENOTFOUND') ||
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

const executeWorkflowRun = async ({ workflow, runId, executionData = {}, loggerContext = {}, initialVisited = new Set(), initialPayload = undefined, initialContext = undefined }) => {
  const { nodes, edges } = getWorkflowNodesAndEdges(workflow);

  if (nodes.length === 0) {
    const err = new Error('Workflow has no nodes to execute');
    err.statusCode = 400;
    throw err;
  }

  let payload = initialPayload !== undefined ? initialPayload : (executionData?.payload || executionData || {});
  const context = initialContext || {
    runId,
    workflowId: workflow.id,
    startedAt: new Date().toISOString(),
    nodes: {},
  };

  try {
    const visited = new Set(initialVisited || []);
    const queue = buildInitialQueue(nodes, edges, visited);

    while (queue.length > 0) {
      const currentRun = await workflowRunModel.getWorkflowRunById(runId);
      if (currentRun.status === 'paused') {
        break;
      }

      const nodeId = queue.shift();
      if (!nodeId || visited.has(nodeId)) continue;

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) continue;

      visited.add(nodeId);

      const nodeExecution = await nodeExecutionModel.createNodeExecution(runId, workflow.id, nodeId, {
        name: node?.data?.label || node?.data?.nodeType || 'Node',
        type: node?.data?.nodeType || 'unknown',
        inputData: { payload, context, config: node?.data || {} },
      });

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

    const finalRun = await workflowRunModel.getWorkflowRunById(runId);
    if (finalRun.status === 'paused') {
      await workflowRunModel.updateWorkflowRunStatus(runId, 'paused', null);
      return workflowRunModel.getWorkflowRunWithNodes(runId);
    }

    const completedRun = await workflowRunModel.completeWorkflowRun(runId, 'completed', null);
    return workflowRunModel.getWorkflowRunWithNodes(completedRun.id);
  } catch (err) {
    await workflowRunModel.completeWorkflowRun(runId, 'failed', err.message);
    logger.error('Workflow execution failed', {
      workflowId: workflow.id,
      runId,
      error: err.message,
      ...loggerContext,
    });
    return workflowRunModel.getWorkflowRunWithNodes(runId);
  }
};

module.exports = {
  executeWorkflowRun,
  getWorkflowNodesAndEdges,
};
