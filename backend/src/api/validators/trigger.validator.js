const Joi = require('joi');
const cron = require('node-cron');

// Webhook trigger schema
const webhookTriggerSchema = Joi.object({
  workflowId: Joi.string().uuid().required(),
  triggerType: Joi.string().valid('webhook').required(),
  webhookUrl: Joi.string().uri().required(),
  webhookSecret: Joi.string().min(8).optional(),
  isActive: Joi.boolean().optional(),
});

// Schedule trigger schema
const scheduleTriggerSchema = Joi.object({
  workflowId: Joi.string().uuid().required(),
  triggerType: Joi.string().valid('schedule').required(),
  cronExpression: Joi.string()
    .custom((value, helpers) => {
      const expression = String(value || '').trim();

      if (!cron.validate(expression)) {
        return helpers.error('string.pattern.base');
      }

      return expression;
    })
    .required()
    .messages({
      'string.pattern.base': 'cronExpression must be a valid cron pattern with 5 or 6 fields',
    }),
  timezone: Joi.string().default('UTC'),
  isActive: Joi.boolean().optional(),
});

// Create trigger schema (supports both webhook and schedule)
const createTriggerSchema = Joi.alternatives().try(webhookTriggerSchema, scheduleTriggerSchema).required();

const listTriggerQuerySchema = Joi.object({
  workflowId: Joi.string().uuid().required(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  offset: Joi.number().integer().min(0).optional(),
});

const toggleTriggerSchema = Joi.object({
  isActive: Joi.boolean().required(),
});

// Update trigger schema (all fields optional except workflowId)
const updateTriggerSchema = Joi.object({
  triggerType: Joi.string().valid('webhook', 'schedule').optional(),
  webhookUrl: Joi.string().uri().optional(),
  webhookSecret: Joi.string().min(8).optional(),
  cronExpression: Joi.string().optional(),
  timezone: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
});

module.exports = {
  createTriggerSchema,
  updateTriggerSchema,
  listTriggerQuerySchema,
  toggleTriggerSchema,
  webhookTriggerSchema,
  scheduleTriggerSchema,
};
