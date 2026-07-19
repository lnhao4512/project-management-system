const projectRepository = require('./project.repository');
const AppError = require('../../utils/appError');
const { parsePagination, buildPaginationMeta } = require('../../utils/helpers');
const logService = require('../logs/log.service');
const notificationService = require('../notifications/notification.service');

class ProjectService {
  /**
   * Get all projects (with role-based filtering)
   */
  async getAllProjects(query, user) {
    const { page, limit, skip } = parsePagination(query);
    const filter = {};

    // Non-admin can only see projects they're involved in
    if (user.role === 'employee') {
      filter.$or = [{ owner: user._id }, { 'members.user': user._id }];
    }

    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;

    if (query.search && query.search.trim()) {
      const searchRegex = { $regex: query.search.trim(), $options: 'i' };
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          { $or: [{ name: searchRegex }, { description: searchRegex }] }
        ];
        delete filter.$or;
      } else {
        filter.$or = [{ name: searchRegex }, { description: searchRegex }];
      }
    }

    const [projectsDocs, total] = await Promise.all([
      projectRepository.findAll(filter, { skip, limit, sort: query.sort || '-createdAt' }),
      projectRepository.count(filter),
    ]);

    // Lấy thống kê task cho mỗi dự án
    const Task = require('../tasks/task.model');
    const projectIds = projectsDocs.map((p) => p._id);
    const taskStats = await Task.aggregate([
      { $match: { project: { $in: projectIds }, isDeleted: false } },
      {
        $group: {
          _id: '$project',
          totalTasks: { $sum: 1 },
          completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
        },
      },
    ]);

    const memberTaskStats = await Task.aggregate([
      { $match: { project: { $in: projectIds }, isDeleted: false, assignedTo: { $ne: null } } },
      {
        $group: {
          _id: { project: '$project', user: '$assignedTo' },
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } }
    ]);

    const projects = projectsDocs.map((p) => {
      const stats = taskStats.find((t) => t._id.toString() === p._id.toString()) || { totalTasks: 0, completedTasks: 0 };
      
      const pMemberStats = [];
      const addedUsers = new Set();

      // First add explicit project members
      if (p.members) {
        p.members.forEach(m => {
          if (m.user) {
            const mStats = memberTaskStats.find(st => st._id.project.toString() === p._id.toString() && st._id.user.toString() === m.user._id.toString());
            pMemberStats.push({
              user: { _id: m.user._id, name: m.user.name, role: m.user.role || m.role },
              total: mStats ? mStats.total : 0,
              completed: mStats ? mStats.completed : 0
            });
            addedUsers.add(m.user._id.toString());
          }
        });
      }

      // Then add users who have tasks but are NOT explicit project members
      memberTaskStats.filter(st => st._id.project.toString() === p._id.toString()).forEach(st => {
        const userIdStr = st._id.user.toString();
        if (!addedUsers.has(userIdStr) && st.userInfo) {
          pMemberStats.push({
            user: { _id: st.userInfo._id, name: st.userInfo.name, role: st.userInfo.role },
            total: st.total,
            completed: st.completed
          });
          addedUsers.add(userIdStr);
        }
      });

      const doc = p.toObject();
      return {
        ...doc,
        totalTasks: stats.totalTasks,
        completedTasks: stats.completedTasks,
        progress: stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0,
        memberStats: pMemberStats
      };
    });

    return { projects, pagination: buildPaginationMeta(total, page, limit) };
  }

  /**
   * Get project by ID
   */
  async getProjectById(id, user) {
    const project = await projectRepository.findById(id);
    if (!project) throw new AppError('Project not found', 404);

    // Check access for employees
    if (user.role === 'employee') {
      const isMember = await projectRepository.isMember(id, user._id);
      if (!isMember) throw new AppError('Access denied to this project', 403);
    }

    return project;
  }

  /**
   * Create project
   */
  async createProject(data, user) {
    const projectData = {
      ...data,
      owner: user._id,
      members: [{ user: user._id, role: 'project_manager' }],
    };
    const project = await projectRepository.create(projectData);

    await logService.createLog({
      action: 'project_created',
      performedBy: user._id,
      targetType: 'Project',
      targetId: project._id,
      targetName: project.name,
      description: `Project "${project.name}" created`,
    });

    return project;
  }

  /**
   * Update project
   */
  async updateProject(id, data, user) {
    const project = await projectRepository.findById(id);
    if (!project) throw new AppError('Project not found', 404);

    // Check permission
    if (user.role !== 'admin' && project.owner._id.toString() !== user._id.toString()) {
      throw new AppError('Only project owner or admin can update', 403);
    }

    const updated = await projectRepository.updateById(id, data);

    await logService.createLog({
      action: 'project_updated',
      performedBy: user._id,
      targetType: 'Project',
      targetId: id,
      targetName: project.name,
      changes: { before: project.toObject(), after: updated.toObject() },
      description: `Project "${project.name}" updated`,
    });

    return updated;
  }

  /**
   * Delete project (soft delete)
   */
  async deleteProject(id, user) {
    const project = await projectRepository.findById(id);
    if (!project) throw new AppError('Project not found', 404);

    if (user.role !== 'admin' && project.owner._id.toString() !== user._id.toString()) {
      throw new AppError('Only project owner or admin can delete', 403);
    }

    await projectRepository.softDelete(id);

    await logService.createLog({
      action: 'project_deleted',
      performedBy: user._id,
      targetType: 'Project',
      targetId: id,
      targetName: project.name,
      description: `Project "${project.name}" deleted`,
    });
  }

  /**
   * Add member to project
   */
  async addMember(projectId, userId, role, requestingUser) {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new AppError('Project not found', 404);

    if (requestingUser.role !== 'admin' && project.owner._id.toString() !== requestingUser._id.toString()) {
      throw new AppError('Only project owner or admin can add members', 403);
    }

    const alreadyMember = project.members.some((m) => m.user._id.toString() === userId);
    if (alreadyMember || project.owner._id.toString() === userId) {
      throw new AppError('User is already a project member', 409);
    }

    const updated = await projectRepository.updateById(projectId, {
      $push: { members: { user: userId, role } },
    });

    // Notify new member
    await notificationService.createNotification({
      recipient: userId,
      sender: requestingUser._id,
      type: 'project_member_added',
      title: 'Thêm vào dự án',
      message: `Bạn đã được thêm vào dự án "${project.name}"`,
      relatedProject: projectId,
    });

    await logService.createLog({
      action: 'project_member_added',
      performedBy: requestingUser._id,
      targetType: 'Project',
      targetId: projectId,
      targetName: project.name,
      description: `Member added to project "${project.name}"`,
      project: projectId,
    });

    return updated;
  }

  /**
   * Remove member from project
   */
  async removeMember(projectId, userId, requestingUser) {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new AppError('Project not found', 404);

    if (requestingUser.role !== 'admin' && project.owner._id.toString() !== requestingUser._id.toString()) {
      throw new AppError('Only project owner or admin can remove members', 403);
    }

    const updated = await projectRepository.updateById(projectId, {
      $pull: { members: { user: userId } },
    });

    await logService.createLog({
      action: 'project_member_removed',
      performedBy: requestingUser._id,
      targetType: 'Project',
      targetId: projectId,
      targetName: project.name,
      description: `Member removed from project "${project.name}"`,
      project: projectId,
    });

    return updated;
  }
}

module.exports = new ProjectService();
