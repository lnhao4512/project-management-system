const express = require('express');
const router = express.Router();
const workloadController = require('./workload.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isAdminOrPM } = require('../../middlewares/role.middleware');

router.use(authenticate);

router.get('/dashboard', workloadController.getDashboardStats);
router.get('/workload', isAdminOrPM, workloadController.getWorkloadStats);
router.get('/recent-tasks', workloadController.getRecentTasks);
router.get('/weekly-chart', workloadController.getWeeklyChart);
router.get('/upcoming-deadlines', workloadController.getUpcomingDeadlines);
router.get('/project-progress', workloadController.getProjectProgress);

module.exports = router;
