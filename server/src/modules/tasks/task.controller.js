const taskService = require('./task.service');
const ApiResponse = require('../../utils/apiResponse');

class TaskController {
  async getAllTasks(req, res, next) {
    try {
      const result = await taskService.getAllTasks(req.query, req.user);
      return ApiResponse.paginated(res, result.tasks, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req, res, next) {
    try {
      const task = await taskService.getTaskById(req.params.id, req.user);
      return ApiResponse.success(res, task);
    } catch (error) {
      next(error);
    }
  }

  async createTask(req, res, next) {
    try {
      const task = await taskService.createTask(req.body, req.user);
      // Emit socket event
      if (req.io) {
        req.io.to(`project:${req.body.project}`).emit('task:created', task);
      }
      return ApiResponse.created(res, task, 'Task created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req, res, next) {
    try {
      const task = await taskService.updateTask(req.params.id, req.body, req.user);
      if (req.io) {
        req.io.to(`task:${req.params.id}`).emit('task:updated', task);
      }
      return ApiResponse.success(res, task, 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async assignTask(req, res, next) {
    try {
      const task = await taskService.assignTask(req.params.id, req.body.assignedTo, req.user);
      return ApiResponse.success(res, task, 'Task assigned successfully');
    } catch (error) {
      next(error);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const { status, progress } = req.body;
      const task = await taskService.changeStatus(req.params.id, status, progress, req.user);
      if (req.io) {
        req.io.to(`task:${req.params.id}`).emit('task:status_changed', task);
        req.io.to(`project:${task.project._id || task.project}`).emit('task:status_changed', task);
      }
      return ApiResponse.success(res, task, 'Status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateProgress(req, res, next) {
    try {
      const task = await taskService.updateProgress(req.params.id, req.body.progress, req.user);
      if (req.io) {
        req.io.to(`task:${req.params.id}`).emit('task:progress_updated', task);
      }
      return ApiResponse.success(res, task, 'Progress updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req, res, next) {
    try {
      await taskService.deleteTask(req.params.id, req.user);
      return ApiResponse.success(res, null, 'Task deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getMyTasks(req, res, next) {
    try {
      const result = await taskService.getMyTasks(req.query, req.user);
      return ApiResponse.paginated(res, result.tasks, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getOverdueTasks(req, res, next) {
    try {
      const tasks = await taskService.getOverdueTasks(req.user);
      return ApiResponse.success(res, tasks);
    } catch (error) {
      next(error);
    }
  }

  async remindTask(req, res, next) {
    try {
      await taskService.remindTask(req.params.id, req.user);
      return ApiResponse.success(res, null, 'Đã gửi email nhắc nhở');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TaskController();
