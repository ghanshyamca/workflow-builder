const triggerService = require('../../services/trigger.service');

const create = async (req, res) => {
  try {
    const userId = req.user.userId;
    const trigger = await triggerService.createTrigger(req.body.workflowId, userId, req.body);
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
    const { id } = req.params;
    const userId = req.user.userId;
    const trigger = await triggerService.updateTrigger(id, userId, req.body);
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
    const userId = req.user.userId;
    const trigger = await triggerService.toggleTriggerActive(id, userId, req.body.isActive);
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
