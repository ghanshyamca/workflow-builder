const Joi = require('joi');

// Create workflow run schema
const createWorkflowRunSchema = Joi.object({
  workflowId: Joi.string().uuid().required(),
  triggerId: Joi.string().uuid().optional().allow(null),
  executionData: Joi.object().optional(),
});

// Update workflow run schema
const updateWorkflowRunSchema = Joi.object({
  status: Joi.string().valid('pending', 'running', 'completed', 'failed', 'paused').optional(),
  errorMessage: Joi.string().optional().allow(null),
});

// Create node execution schema
const createNodeExecutionSchema = Joi.object({
  runId: Joi.string().uuid().required(),
  workflowId: Joi.string().uuid().required(),
  nodeId: Joi.string().required(),
  nodeData: Joi.object().optional(),
});

// Update node execution schema
const updateNodeExecutionSchema = Joi.object({
  status: Joi.string().valid('pending', 'running', 'completed', 'failed').optional(),
  outputData: Joi.object().optional(),
  errorMessage: Joi.string().optional().allow(null),
});

module.exports = {
  createWorkflowRunSchema,
  updateWorkflowRunSchema,
  createNodeExecutionSchema,
  updateNodeExecutionSchema,
};
