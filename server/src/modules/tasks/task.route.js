const express = require('express');
const router = express.Router();
const taskController = require('./task.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isAdminOrPM } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const {
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
  updateProgressSchema,
  assignTaskSchema,
  listTasksSchema,
} = require('./task.validation');

router.use(authenticate);

// Special routes first
router.get('/my-tasks', validate(listTasksSchema), taskController.getMyTasks);
router.get('/overdue', taskController.getOverdueTasks);

// Main CRUD
router.get('/', validate(listTasksSchema), taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', isAdminOrPM, validate(createTaskSchema), taskController.createTask);
router.put('/:id', isAdminOrPM, validate(updateTaskSchema), taskController.updateTask);
router.delete('/:id', isAdminOrPM, taskController.deleteTask);

// Task operations
router.patch('/:id/assign', isAdminOrPM, validate(assignTaskSchema), taskController.assignTask);
router.patch('/:id/status', validate(updateStatusSchema), taskController.changeStatus);
router.patch('/:id/progress', validate(updateProgressSchema), taskController.updateProgress);
router.post('/:id/remind', isAdminOrPM, taskController.remindTask);

module.exports = router;
