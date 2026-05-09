const express = require('express');
const executionController = require('../controllers/execution.controller');
const authMiddleware = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const {
	createWorkflowRunSchema,
	updateWorkflowRunSchema,
} = require('../validators/execution.validator');

const router = express.Router();

// Create workflow run
router.post('/', authMiddleware, validateRequest(createWorkflowRunSchema), executionController.createWorkflowRun);

// List workflow runs for a specific workflow
router.get('/workflow/:workflowId', authMiddleware, executionController.listWorkflowRuns);

// Get workflow run with node executions
router.get('/:runId', authMiddleware, executionController.getWorkflowRun);

// Update workflow run status
router.put('/:runId/status', authMiddleware, validateRequest(updateWorkflowRunSchema), executionController.updateWorkflowRunStatus);

// Complete workflow run
router.post('/:runId/complete', authMiddleware, executionController.completeWorkflowRun);

module.exports = router;
