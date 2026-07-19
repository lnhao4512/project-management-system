const express = require('express');
const router = express.Router();
const logController = require('./log.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isAdminOrPM } = require('../../middlewares/role.middleware');

router.use(authenticate);

router.get('/', isAdminOrPM, logController.getLogs);
router.get('/task/:taskId', logController.getTaskHistory);
router.get('/project/:projectId', logController.getProjectLogs);

module.exports = router;
