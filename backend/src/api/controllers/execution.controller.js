const executionService = require('../../services/execution.service');
const logger = require('../../utils/logger');

// Create workflow run
const createWorkflowRun = async (req, res, next) => {
  try {
    const run = await executionService.createWorkflowRun(req.user.userId, req.body);
    logger.info(`Workflow run created: ${run.id} for workflow: ${run.workflow_id}`);
    
    return res.status(201).json(run);
  } catch (err) {
    logger.error(`Error creating workflow run: ${err.message}`);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
};

// List workflow runs
const listWorkflowRuns = async (req, res, next) => {
  try {
    const { workflowId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const runs = await executionService.listWorkflowRuns(workflowId, req.user.userId, { limit, offset });
    
    return res.status(200).json(runs);
  } catch (err) {
    logger.error(`Error listing workflow runs: ${err.message}`);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
};

// Get workflow run
const getWorkflowRun = async (req, res, next) => {
  try {
    const { runId } = req.params;
    const data = await executionService.getWorkflowRun(runId, req.user.userId);
    
    return res.status(200).json(data);
  } catch (err) {
    logger.error(`Error fetching workflow run: ${err.message}`);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
};

// Update workflow run status
const updateWorkflowRunStatus = async (req, res, next) => {
  try {
    const { runId } = req.params;
    const run = await executionService.updateWorkflowRunStatus(
      runId,
      req.user.userId,
      req.body.status,
      req.body.errorMessage
    );
    
    logger.info(`Workflow run ${runId} updated to status: ${req.body.status}`);
    
    return res.status(200).json(run);
  } catch (err) {
    logger.error(`Error updating workflow run status: ${err.message}`);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
};

// Complete workflow run
const completeWorkflowRun = async (req, res, next) => {
  try {
    const { runId } = req.params;
    const { status = 'completed', errorMessage = null } = req.body;
    
    const run = await executionService.completeWorkflowRun(
      runId,
      req.user.userId,
      status,
      errorMessage
    );
    
    logger.info(`Workflow run ${runId} completed with status: ${status}`);
    
    return res.status(200).json(run);
  } catch (err) {
    logger.error(`Error completing workflow run: ${err.message}`);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
};

module.exports = {
  createWorkflowRun,
  listWorkflowRuns,
  getWorkflowRun,
  updateWorkflowRunStatus,
  completeWorkflowRun,
};
