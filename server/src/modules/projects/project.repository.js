const Project = require('./project.model');

class ProjectRepository {
  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 10, sort = '-createdAt' } = options;
    return Project.find(filter)
      .populate('owner', 'name email avatar role')
      .populate('members.user', 'name email avatar role')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async count(filter = {}) {
    return Project.countDocuments(filter);
  }

  async findById(id) {
    return Project.findById(id)
      .populate('owner', 'name email avatar role')
      .populate('members.user', 'name email avatar role');
  }

  async create(data) {
    return Project.create(data);
  }

  async updateById(id, data) {
    return Project.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');
  }

  async softDelete(id) {
    return Project.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() }, { new: true });
  }

  async isMember(projectId, userId) {
    const project = await Project.findOne({
      _id: projectId,
      $or: [{ owner: userId }, { 'members.user': userId }],
    });
    return !!project;
  }

  async getMemberRole(projectId, userId) {
    const project = await Project.findById(projectId);
    if (!project) return null;
    if (project.owner.toString() === userId.toString()) return 'owner';
    const member = project.members.find((m) => m.user.toString() === userId.toString());
    return member ? member.role : null;
  }
}

module.exports = new ProjectRepository();
