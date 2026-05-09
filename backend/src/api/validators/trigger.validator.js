const Joi = require('joi');

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
    .regex(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/)
    .required()
    .messages({
      'string.pattern.base': 'cronExpression must be a valid cron pattern (mm hh dd MM DOW)',
    }),
  timezone: Joi.string().default('UTC'),
  isActive: Joi.boolean().optional(),
});

// Create trigger schema (supports both webhook and schedule)
const createTriggerSchema = Joi.alternatives().try(webhookTriggerSchema, scheduleTriggerSchema).required();

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
  webhookTriggerSchema,
  scheduleTriggerSchema,
};
