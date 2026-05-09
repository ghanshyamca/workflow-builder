const Joi = require('joi');

const createWorkflowSchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  description: Joi.string().allow(null, ''),
  definition: Joi.object().required(),
});

const updateWorkflowSchema = Joi.object({
  name: Joi.string().min(3).max(255),
  description: Joi.string().allow(null, ''),
  definition: Joi.object(),
  status: Joi.string().valid('draft', 'published'),
});

const executeWorkflowSchema = Joi.object({
  payload: Joi.object().optional(),
}).unknown(true);

module.exports = {
  createWorkflowSchema,
  updateWorkflowSchema,
  executeWorkflowSchema,
};
