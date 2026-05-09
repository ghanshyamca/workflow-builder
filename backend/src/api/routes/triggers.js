const express = require('express');
const router = express.Router();
const triggerController = require('../controllers/trigger.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', triggerController.create);
router.get('/', triggerController.list);
router.get('/:id', triggerController.get);
router.put('/:id', triggerController.update);
router.delete('/:id', triggerController.remove);
router.post('/:id/toggle', triggerController.toggle);

module.exports = router;
