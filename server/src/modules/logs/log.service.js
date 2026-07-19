const Log = require('./log.model');

class LogService {
  async createLog(data) {
    try {
      return Log.create(data);
    } catch (error) {
      console.error('Log creation error:', error.message);
    }
  }

  async getLogs(filter = {}, options = {}) {
    const { skip = 0, limit = 20, sort = '-createdAt' } = options;
    return Log.find(filter)
      .populate('performedBy', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async countLogs(filter = {}) {
    return Log.countDocuments(filter);
  }

  async getTaskHistory(taskId) {
    return Log.find({ targetType: 'Task', targetId: taskId })
      .populate('performedBy', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  async getProjectLogs(projectId) {
    return Log.find({ project: projectId })
      .populate('performedBy', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);
  }
}

module.exports = new LogService();
