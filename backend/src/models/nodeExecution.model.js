const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Create node execution
const createNodeExecution = async (runId, workflowId, nodeId, nodeData = {}) => {
  const id = uuidv4();
  const query = `
    INSERT INTO node_executions 
    (id, run_id, workflow_id, node_id, node_name, node_type, status, input_data, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    id,
    runId,
    workflowId,
    nodeId,
    nodeData.name || 'Unnamed Node',
    nodeData.type || 'unknown',
    'pending',
    JSON.stringify(nodeData.inputData || {}),
  ]);
  
  return result.rows[0];
};

// Get node executions for a run
const getNodeExecutionsByRun = async (runId) => {
  const query = `
    SELECT * FROM node_executions 
    WHERE run_id = $1
    ORDER BY created_at ASC
  `;
  
  const result = await pool.query(query, [runId]);
  return result.rows;
};

// Get node execution by ID
const getNodeExecutionById = async (id) => {
  const query = 'SELECT * FROM node_executions WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Update node execution
const updateNodeExecution = async (id, status, outputData = null, errorMessage = null) => {
  const query = `
    UPDATE node_executions
    SET 
      status = $1,
      output_data = $2,
      error_message = $3,
      end_time = NOW(),
      duration_ms = EXTRACT(epoch FROM (NOW() - start_time)) * 1000,
      updated_at = NOW()
    WHERE id = $4
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    status,
    outputData ? JSON.stringify(outputData) : null,
    errorMessage,
    id,
  ]);
  
  return result.rows[0];
};

// Start node execution
const startNodeExecution = async (id) => {
  const query = `
    UPDATE node_executions
    SET status = $1, start_time = NOW(), updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;
  
  const result = await pool.query(query, ['running', id]);
  return result.rows[0];
};

module.exports = {
  createNodeExecution,
  getNodeExecutionsByRun,
  getNodeExecutionById,
  updateNodeExecution,
  startNodeExecution,
};
