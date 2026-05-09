const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflow.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', workflowController.create);
router.get('/', workflowController.list);
router.get('/:id', workflowController.get);
router.put('/:id', workflowController.update);
router.delete('/:id', workflowController.remove);
router.post('/:id/publish', workflowController.publish);
router.post('/:id/execute', workflowController.execute);

// Run control endpoints
router.patch('/:id/runs/:runId/pause', workflowController.pause);
router.patch('/:id/runs/:runId/resume', workflowController.resume);

// Trigger endpoints
router.post('/:id/triggers', workflowController.createTrigger);
router.get('/:id/triggers', workflowController.listTriggers);

// Webhook trigger endpoint (no auth required)
router.post('/:id/trigger/:secretKey', workflowController.triggerViaWebhook);

module.exports = router;
