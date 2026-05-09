const workflowRunModel = require('../models/workflowRun.model');
const nodeExecutionModel = require('../models/nodeExecution.model');
const workflowModel = require('../models/workflow.model');

// Create workflow run
const createWorkflowRun = async (userId, data) => {
  // Verify user owns the workflow
  const wf = await workflowModel.getWorkflowById(data.workflowId);
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
  
  return workflowRunModel.createWorkflowRun(
    data.workflowId,
    userId,
    data.triggerId,
    data.executionData || {}
  );
};

// List workflow runs
const listWorkflowRuns = async (workflowId, userId, options = {}) => {
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
  
  return workflowRunModel.getWorkflowRuns(workflowId, options);
};

// Get workflow run
const getWorkflowRun = async (runId, userId) => {
  const data = await workflowRunModel.getWorkflowRunWithNodes(runId);
  
  if (!data.run) {
    const err = new Error('Workflow run not found');
    err.statusCode = 404;
    throw err;
  }
  
  // Verify user owns the workflow
  const wf = await workflowModel.getWorkflowById(data.run.workflow_id);
  if (!wf || wf.user_id !== userId) {
    const err = new Error('Unauthorized');
    err.statusCode = 403;
    throw err;
  }
  
  return data;
};

// Update workflow run status
const updateWorkflowRunStatus = async (runId, userId, status, errorMessage) => {
  const run = await workflowRunModel.getWorkflowRunById(runId);
  
  if (!run) {
    const err = new Error('Workflow run not found');
    err.statusCode = 404;
    throw err;
  }
  
  // Verify user owns the workflow
  const wf = await workflowModel.getWorkflowById(run.workflow_id);
  if (!wf || wf.user_id !== userId) {
    const err = new Error('Unauthorized');
    err.statusCode = 403;
    throw err;
  }
  
  return workflowRunModel.updateWorkflowRunStatus(runId, status, errorMessage);
};

// Complete workflow run
const completeWorkflowRun = async (runId, userId, status, errorMessage) => {
  const run = await workflowRunModel.getWorkflowRunById(runId);
  
  if (!run) {
    const err = new Error('Workflow run not found');
    err.statusCode = 404;
    throw err;
  }
  
  // Verify user owns the workflow
  const wf = await workflowModel.getWorkflowById(run.workflow_id);
  if (!wf || wf.user_id !== userId) {
    const err = new Error('Unauthorized');
    err.statusCode = 403;
    throw err;
  }
  
  return workflowRunModel.completeWorkflowRun(runId, status, errorMessage);
};

module.exports = {
  createWorkflowRun,
  listWorkflowRuns,
  getWorkflowRun,
  updateWorkflowRunStatus,
  completeWorkflowRun,
};
