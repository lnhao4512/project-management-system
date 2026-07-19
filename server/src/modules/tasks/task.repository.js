const Task = require('./task.model');

class TaskRepository {
  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 20, sort = '-createdAt' } = options;
    return Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async count(filter = {}) {
    return Task.countDocuments(filter);
  }

  async findById(id) {
    return Task.findById(id)
      .populate('assignedTo', 'name email avatar role')
      .populate('assignedBy', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color status')
      .populate('attachments');
  }

  async create(data) {
    return Task.create(data);
  }

  async updateById(id, data) {
    return Task.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'name color');
  }

  async softDelete(id) {
    return Task.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() }, { new: true });
  }

  async countByStatus(projectId) {
    return Task.aggregate([
      { $match: { project: projectId, isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }

  async countByPriority(projectId) {
    return Task.aggregate([
      { $match: { project: projectId, isDeleted: false } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);
  }

  async getOverdueTasks(userId = null) {
    const filter = {
      deadline: { $lt: new Date() },
      status: { $ne: 'done' },
    };
    if (userId) filter.assignedTo = userId;
    return Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'name color')
      .sort({ deadline: 1 });
  }

  async getUserTasks(userId, filter = {}, options = {}) {
    const { skip = 0, limit = 20, sort = '-createdAt' } = options;
    return Task.find({ ...filter, assignedTo: userId })
      .populate('project', 'name color')
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }
}

module.exports = new TaskRepository();
