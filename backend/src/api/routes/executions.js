const express = require('express');
const executionController = require('../controllers/execution.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Create workflow run
router.post('/', authMiddleware, executionController.createWorkflowRun);

// List workflow runs for a specific workflow
router.get('/workflow/:workflowId', authMiddleware, executionController.listWorkflowRuns);

// Get workflow run with node executions
router.get('/:runId', authMiddleware, executionController.getWorkflowRun);

// Update workflow run status
router.put('/:runId/status', authMiddleware, executionController.updateWorkflowRunStatus);

// Complete workflow run
router.post('/:runId/complete', authMiddleware, executionController.completeWorkflowRun);

module.exports = router;
