const workflowService = require('../../services/workflow.service');
const triggerService = require('../../services/trigger.service');

const create = async (req, res) => {
  try {
    const userId = req.user.userId;
    const wf = await workflowService.createWorkflow(userId, req.body);
    res.status(201).json({ status: 'success', data: wf });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'error', message: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to create workflow' });
  }
};

const list = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const items = await workflowService.listWorkflows(userId, { limit, offset });
    res.json({ status: 'success', data: items });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to list workflows' });
  }
};

const get = async (req, res) => {
  try {
    const id = req.params.id;
    const wf = await workflowService.getWorkflow(id);
    res.json({ status: 'success', data: wf });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'error', message: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to get workflow' });
  }
};

const update = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.userId;
    const wf = await workflowService.updateWorkflow(id, userId, req.body);
    res.json({ status: 'success', data: wf });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'error', message: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to update workflow' });
  }
};

const remove = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.userId;
    await workflowService.deleteWorkflow(id, userId);
    res.json({ status: 'success', message: 'Workflow deleted' });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'error', message: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to delete workflow' });
  }
};

const publish = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.userId;
    const wf = await workflowService.publishWorkflow(id, userId);
    res.json({ status: 'success', data: wf });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'error', message: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to publish workflow' });
  }
};

const execute = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.userId;
    const result = await workflowService.executeWorkflow(id, userId, req.body || {});
    res.status(201).json({ status: 'success', data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'error', message: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to execute workflow' });
  }
};

const pause = async (req, res) => {
  try {
    const runId = req.params.runId;
    const userId = req.user.userId;
    const result = await workflowService.pauseWorkflowRun(runId, userId);
    res.json({ status: 'success', data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'error', message: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to pause workflow' });
  }
};

const resume = async (req, res) => {
  try {
    const runId = req.params.runId;
    const userId = req.user.userId;
    const result = await workflowService.resumeWorkflowRun(runId, userId);
    res.json({ status: 'success', data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'error', message: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to resume workflow' });
  }
};

const triggerViaWebhook = async (req, res) => {
  try {
    const { id, secretKey } = req.params;
    const payload = req.body || {};
    const result = await workflowService.executeWorkflowViaWebhook(id, secretKey, payload);
    res.status(201).json({ status: 'success', data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'error', message: err.message });
    res.status(500).json({ status: 'error', message: 'Webhook trigger failed' });
  }
};

const createTrigger = async (req, res) => {
  try {
    const workflowId = req.params.id;
    const userId = req.user.userId;
    const trigger = await triggerService.createTrigger(workflowId, userId, req.body);
    res.status(201).json({ status: 'success', data: trigger });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'error', message: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to create trigger' });
  }
};

const listTriggers = async (req, res) => {
  try {
    const workflowId = req.params.id;
    const userId = req.user.userId;
    const triggers = await triggerService.listTriggers(workflowId, userId);
    res.json({ status: 'success', data: triggers });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'error', message: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to list triggers' });
  }
};

module.exports = {
  create,
  list,
  get,
  update,
  remove,
  publish,
  execute,
  pause,
  resume,
  triggerViaWebhook,
  createTrigger,
  listTriggers,
};
