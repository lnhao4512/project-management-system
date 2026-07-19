const logService = require('./log.service');
const ApiResponse = require('../../utils/apiResponse');
const { parsePagination, buildPaginationMeta } = require('../../utils/helpers');

class LogController {
  async getLogs(req, res, next) {
    try {
      const { page, limit, skip } = parsePagination(req.query);
      const filter = {};
      if (req.query.action) filter.action = req.query.action;
      if (req.query.userId) filter.performedBy = req.query.userId;
      if (req.query.project) filter.project = req.query.project;

      if (req.query.startDate || req.query.endDate) {
        filter.createdAt = {};
        if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
        if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
      }

      if (req.query.search) {
        const mongoose = require('mongoose');
        const User = mongoose.model('User');
        const matchedUsers = await User.find({ name: { $regex: req.query.search, $options: 'i' } }).select('_id');
        const userIds = matchedUsers.map(u => u._id);

        filter.$or = [
          { description: { $regex: req.query.search, $options: 'i' } },
          { performedBy: { $in: userIds } }
        ];
      }

      const [logs, total] = await Promise.all([
        logService.getLogs(filter, { skip, limit }),
        logService.countLogs(filter),
      ]);

      return ApiResponse.paginated(res, logs, buildPaginationMeta(total, page, limit));
    } catch (error) {
      next(error);
    }
  }

  async getTaskHistory(req, res, next) {
    try {
      const logs = await logService.getTaskHistory(req.params.taskId);
      return ApiResponse.success(res, logs);
    } catch (error) {
      next(error);
    }
  }

  async getProjectLogs(req, res, next) {
    try {
      const logs = await logService.getProjectLogs(req.params.projectId);
      return ApiResponse.success(res, logs);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LogController();
