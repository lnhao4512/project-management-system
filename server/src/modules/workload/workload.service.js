const Task = require('../tasks/task.model');
const Project = require('../projects/project.model');
const User = require('../users/user.model');
const { startOfWeek, endOfWeek, subWeeks, format } = require('date-fns');

class WorkloadService {
  /**
   * Get workload per employee (task count)
   */
  async getWorkloadStats() {
    const workload = await User.aggregate([
      { $match: { isDeleted: false } },
      {
        $lookup: {
          from: 'tasks',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$assignedTo', '$$userId'] }, isDeleted: false } },
            { $project: { title: 1, status: 1, progress: 1, deadline: 1, priority: 1 } }
          ],
          as: 'tasks',
        },
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          user: { name: '$name', email: '$email', avatar: '$avatar' },
          tasks: 1,
          totalTasks: { $size: '$tasks' },
          todoTasks: {
            $size: { $filter: { input: '$tasks', as: 't', cond: { $eq: ['$$t.status', 'todo'] } } }
          },
          doingTasks: {
            $size: { $filter: { input: '$tasks', as: 't', cond: { $eq: ['$$t.status', 'doing'] } } }
          },
          completedTasks: {
            $size: { $filter: { input: '$tasks', as: 't', cond: { $eq: ['$$t.status', 'done'] } } }
          },
        },
      },
      { $sort: { totalTasks: -1 } },
      { $match: { totalTasks: { $gt: 0 } } }
    ]);

    return workload;
  }

  /**
   * Dashboard statistics
   */
  async getDashboardStats(user) {
    const userFilter = user.role === 'employee' ? { assignedTo: user._id } : {};

    const [
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
      totalProjects,
      activeProjects,
    ] = await Promise.all([
      Task.countDocuments({ isDeleted: false, ...userFilter }),
      Task.aggregate([
        { $match: { isDeleted: false, ...userFilter } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { isDeleted: false, ...userFilter } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Task.countDocuments({
        isDeleted: false,
        ...userFilter,
        deadline: { $lt: new Date() },
        status: { $ne: 'done' },
      }),
      user.role === 'employee'
        ? Project.countDocuments({ 'members.user': user._id })
        : Project.countDocuments({}),
      user.role === 'employee'
        ? Project.countDocuments({ 'members.user': user._id, status: 'active' })
        : Project.countDocuments({ status: 'active' }),
    ]);

    const statusMap = { todo: 0, doing: 0, done: 0 };
    tasksByStatus.forEach((s) => (statusMap[s._id] = s.count));

    const priorityMap = { high: 0, medium: 0, low: 0 };
    tasksByPriority.forEach((p) => (priorityMap[p._id] = p.count));

    return {
      tasks: {
        total: totalTasks,
        byStatus: statusMap,
        byPriority: priorityMap,
        overdue: overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((statusMap.done / totalTasks) * 100) : 0,
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
      },
    };
  }

  /**
   * Get recent activity (for dashboard)
   */
  async getRecentTasks(user, limit = 5) {
    const filter = { isDeleted: false };
    if (user.role === 'employee') {
      filter.assignedTo = user._id;
    }
    
    return Task.find(filter)
      .populate('project', 'name color')
      .populate('assignedTo', 'name avatar')
      .sort({ updatedAt: -1 })
      .limit(limit);
  }

  /**
   * Get weekly task completion chart (last 8 weeks)
   */
  async getWeeklyChart(user) {
    const userFilter = user.role === 'employee' ? { assignedTo: user._id } : {};
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      const label = `T${format(weekStart, 'dd/MM')}`;

      const [created, completed] = await Promise.all([
        Task.countDocuments({
          isDeleted: false,
          ...userFilter,
          createdAt: { $gte: weekStart, $lte: weekEnd },
        }),
        Task.countDocuments({
          isDeleted: false,
          ...userFilter,
          status: 'done',
          updatedAt: { $gte: weekStart, $lte: weekEnd },
        }),
      ]);

      weeks.push({ label, created, completed });
    }
    return weeks;
  }

  /**
   * Get upcoming deadlines (next 7 days)
   */
  async getUpcomingDeadlines(user) {
    const userFilter = user.role === 'employee' ? { assignedTo: user._id } : {};
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(now.getDate() + 7);

    return Task.find({
      isDeleted: false,
      ...userFilter,
      status: { $ne: 'done' },
      deadline: { $gte: now, $lte: in7Days },
    })
      .populate('assignedTo', 'name')
      .populate('project', 'name color')
      .sort({ deadline: 1 })
      .limit(10);
  }

  /**
   * Get project completion progress
   */
  async getProjectProgress(user) {
    const matchUser = user.role === 'employee' ? { 'members.user': user._id } : {};
    const projects = await Project.find({ ...matchUser, status: { $ne: 'cancelled' } })
      .select('name color status')
      .limit(10);

    const results = await Promise.all(
      projects.map(async (project) => {
        const [total, done] = await Promise.all([
          Task.countDocuments({ project: project._id, isDeleted: false }),
          Task.countDocuments({ project: project._id, isDeleted: false, status: 'done' }),
        ]);
        return {
          name: project.name,
          color: project.color || '#6366f1',
          status: project.status,
          total,
          done,
          percent: total > 0 ? Math.round((done / total) * 100) : 0,
        };
      })
    );
    return results.filter((r) => r.total > 0).sort((a, b) => b.total - a.total);
  }
}

module.exports = new WorkloadService();
