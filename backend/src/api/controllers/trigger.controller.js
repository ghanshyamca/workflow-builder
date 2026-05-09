const triggerService = require('../../services/trigger.service');
const { createTriggerSchema, updateTriggerSchema } = require('../validators/trigger.validator');

const create = async (req, res) => {
  try {
    const { error, value } = createTriggerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ status: 'error', message: 'Validation error', details: error.details });
    }

    const userId = req.user.userId;
    const trigger = await triggerService.createTrigger(value.workflowId, userId, value);
    res.status(201).json({ status: 'success', data: trigger });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'error', message: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to create trigger' });
  }
};

const list = async (req, res) => {
  try {
    const { workflowId } = req.query;
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    if (!workflowId) {
      return res.status(400).json({ status: 'error', message: 'workflowId is required' });
    }

    const triggers = await triggerService.listTriggers(workflowId, userId, { limit, offset });
    res.json({ status: 'success', data: triggers });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'error', message: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to list triggers' });
  }
};

const get = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const trigger = await triggerService.getTrigger(id, userId);
    res.json({ status: 'success', data: trigger });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'error', message: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to get trigger' });
  }
};

const update = async (req, res) => {
  try {
    const { error, value } = updateTriggerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ status: 'error', message: 'Validation error', details: error.details });
    }

    const { id } = req.params;
    const userId = req.user.userId;
    const trigger = await triggerService.updateTrigger(id, userId, value);
    res.json({ status: 'success', data: trigger });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'error', message: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to update trigger' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    await triggerService.deleteTrigger(id, userId);
    res.json({ status: 'success', message: 'Trigger deleted' });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'error', message: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to delete trigger' });
  }
};

const toggle = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ status: 'error', message: 'isActive must be a boolean' });
    }

    const userId = req.user.userId;
    const trigger = await triggerService.toggleTriggerActive(id, userId, isActive);
    res.json({ status: 'success', data: trigger });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'error', message: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to toggle trigger' });
  }
};

module.exports = {
  create,
  list,
  get,
  update,
  remove,
  toggle,
};
