const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Create workflow run
const createWorkflowRun = async (workflowId, userId, triggerId = null, executionData = {}) => {
  const id = uuidv4();
  const query = `
    INSERT INTO workflow_runs 
    (id, workflow_id, user_id, trigger_id, status, start_time, execution_data, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), $6, NOW())
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    id,
    workflowId,
    userId,
    triggerId,
    'running',
    JSON.stringify(executionData),
  ]);
  
  return result.rows[0];
};

// Get runs for workflow
const getWorkflowRuns = async (workflowId, options = {}) => {
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  
  const query = `
    SELECT * FROM workflow_runs 
    WHERE workflow_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;
  
  const result = await pool.query(query, [workflowId, limit, offset]);
  return result.rows;
};

// Get run by ID
const getWorkflowRunById = async (id) => {
  const query = 'SELECT * FROM workflow_runs WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Update run status
const updateWorkflowRunStatus = async (id, status, errorMessage = null) => {
  const endTime = ['completed', 'failed', 'paused'].includes(status) ? 'NOW()' : 'NULL';
  const query = `
    UPDATE workflow_runs
    SET status = $1, error_message = $2, end_time = ${endTime}, updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `;
  
  const result = await pool.query(query, [status, errorMessage, id]);
  return result.rows[0];
};

// Calculate duration and mark complete
const completeWorkflowRun = async (id, status = 'completed', errorMessage = null) => {
  const query = `
    UPDATE workflow_runs
    SET 
      status = $1,
      end_time = NOW(),
      error_message = $2,
      duration_ms = EXTRACT(epoch FROM (NOW() - start_time)) * 1000,
      updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `;
  
  const result = await pool.query(query, [status, errorMessage, id]);
  return result.rows[0];
};

// Get run with node executions
const getWorkflowRunWithNodes = async (id) => {
  const runQuery = 'SELECT * FROM workflow_runs WHERE id = $1';
  const nodesQuery = 'SELECT * FROM node_executions WHERE run_id = $1 ORDER BY created_at ASC';
  
  const [runResult, nodesResult] = await Promise.all([
    pool.query(runQuery, [id]),
    pool.query(nodesQuery, [id]),
  ]);
  
  return {
    run: runResult.rows[0],
    nodes: nodesResult.rows,
  };
};

// Delete old runs (for cleanup)
const deleteOldRuns = async (workflowId, daysOld = 30) => {
  const query = `
    DELETE FROM workflow_runs 
    WHERE workflow_id = $1 AND created_at < NOW() - INTERVAL '${daysOld} days'
    RETURNING id
  `;
  
  const result = await pool.query(query, [workflowId]);
  return result.rows.length;
};

module.exports = {
  createWorkflowRun,
  getWorkflowRuns,
  getWorkflowRunById,
  updateWorkflowRunStatus,
  completeWorkflowRun,
  getWorkflowRunWithNodes,
  deleteOldRuns,
};
