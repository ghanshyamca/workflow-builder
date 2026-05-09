const express = require('express');
const router = express.Router();
const triggerController = require('../controllers/trigger.controller');
const authMiddleware = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const {
	createTriggerSchema,
	updateTriggerSchema,
	listTriggerQuerySchema,
	toggleTriggerSchema,
} = require('../validators/trigger.validator');

router.use(authMiddleware);

router.post('/', validateRequest(createTriggerSchema), triggerController.create);
router.get('/', validateRequest(listTriggerQuerySchema, 'query'), triggerController.list);
router.get('/:id', triggerController.get);
router.put('/:id', validateRequest(updateTriggerSchema), triggerController.update);
router.delete('/:id', triggerController.remove);
router.post('/:id/toggle', validateRequest(toggleTriggerSchema), triggerController.toggle);

module.exports = router;
