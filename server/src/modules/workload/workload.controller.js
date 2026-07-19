const workloadService = require('./workload.service');
const ApiResponse = require('../../utils/apiResponse');

class WorkloadController {
  async getDashboardStats(req, res, next) {
    try {
      const stats = await workloadService.getDashboardStats(req.user);
      return ApiResponse.success(res, stats);
    } catch (error) {
      next(error);
    }
  }

  async getWorkloadStats(req, res, next) {
    try {
      const data = await workloadService.getWorkloadStats();
      return ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getRecentTasks(req, res, next) {
    try {
      const tasks = await workloadService.getRecentTasks(req.user);
      return ApiResponse.success(res, tasks);
    } catch (error) {
      next(error);
    }
  }

  async getWeeklyChart(req, res, next) {
    try {
      const data = await workloadService.getWeeklyChart(req.user);
      return ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getUpcomingDeadlines(req, res, next) {
    try {
      const data = await workloadService.getUpcomingDeadlines(req.user);
      return ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getProjectProgress(req, res, next) {
    try {
      const data = await workloadService.getProjectProgress(req.user);
      return ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WorkloadController();
