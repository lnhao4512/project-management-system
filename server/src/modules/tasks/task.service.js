const taskRepository = require('./task.repository');
const projectRepository = require('../projects/project.repository');
const AppError = require('../../utils/appError');
const { parsePagination, buildPaginationMeta } = require('../../utils/helpers');
const logService = require('../logs/log.service');
const notificationService = require('../notifications/notification.service');
const userRepository = require('../users/user.repository');
const emailService = require('../../utils/email.service');

class TaskService {
  /**
   * Get tasks with filters
   */
  async getAllTasks(query, user) {
    const { page, limit, skip } = parsePagination(query);
    const filter = {};

    // Employees can only see their own or project tasks
    if (user.role === 'employee') {
      filter.assignedTo = user._id;
    }

    if (query.project) filter.project = query.project;
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.assignedTo) filter.assignedTo = query.assignedTo;
    if (query.assignedTeam) filter.assignedTeam = query.assignedTeam;
    
    if (query.parentTask !== undefined) {
      if (query.parentTask === 'null' || query.parentTask === null) {
        filter.parentTask = null;
      } else {
        filter.parentTask = query.parentTask;
      }
    }
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.deadline) {
      const now = new Date();
      if (query.deadline === 'this_month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        filter.deadline = { $gte: start, $lte: end };
      } else if (query.deadline === 'next_month') {
        const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
        filter.deadline = { $gte: start, $lte: end };
      } else if (query.deadline === 'overdue') {
        filter.deadline = { $lt: now };
        filter.status = { $ne: 'done' };
      }
    } else if (query.overdue === 'true' || query.overdue === true) {
      filter.deadline = { $lt: new Date() };
      filter.status = { $ne: 'done' };
    }

    const [tasks, total] = await Promise.all([
      taskRepository.findAll(filter, { skip, limit, sort: query.sort || '-createdAt' }),
      taskRepository.count(filter),
    ]);

    return { tasks, pagination: buildPaginationMeta(total, page, limit) };
  }

  /**
   * Get task by ID
   */
  async getTaskById(id, user) {
    const task = await taskRepository.findById(id);
    if (!task) throw new AppError('Task not found', 404);

    if (user.role === 'employee') {
      const isAssignee = task.assignedTo?._id?.toString() === user._id.toString() || task.assignedTo?.toString() === user._id.toString();
      if (!isAssignee) {
        const isMember = await projectRepository.isMember(task.project._id || task.project, user._id);
        if (!isMember) throw new AppError('Access denied', 403);
      }
    }

    return task;
  }

  /**
   * Create task — only PM/Admin can create
   */
  async createTask(data, user) {
    if (user.role === 'employee') {
      throw new AppError('Employees cannot create tasks', 403);
    }

    // Validate project exists
    const project = await projectRepository.findById(data.project);
    if (!project) throw new AppError('Project not found', 404);

    // Deadline must be >= today
    if (data.deadline && new Date(data.deadline) < new Date()) {
      throw new AppError('Deadline cannot be in the past', 400);
    }

    const task = await taskRepository.create({
      ...data,
      createdBy: user._id,
      assignedBy: data.assignedTo ? user._id : null,
    });

    await logService.createLog({
      action: 'task_created',
      performedBy: user._id,
      targetType: 'Task',
      targetId: task._id,
      targetName: task.title,
      project: task.project,
      description: `Task "${task.title}" created`,
    });

    // Notify assignee
    if (task.assignedTo) {
      await notificationService.createNotification({
        recipient: task.assignedTo,
        sender: user._id,
        type: 'task_assigned',
        title: 'Công việc mới được giao',
        message: `Bạn vừa được phân công thực hiện công việc "${task.title}"`,
        relatedTask: task._id,
        relatedProject: task.project,
        link: `/tasks/${task._id}`,
      });

      // Send Email Notification
      if (data.sendEmail) {
        userRepository.findById(task.assignedTo).then(assignee => {
          if (assignee && assignee.email) {
            emailService.sendTaskNotificationEmail(
              assignee.email,
              task.title,
              user.name,
              task.deadline,
              task.priority
            );
          }
        }).catch(err => console.error('Error fetching user for email:', err));
      }
    }

    // Nếu tạo công việc con, cập nhật lại tiến độ công việc cha
    if (task.parentTask) {
      await this.recalculateParentProgress(task.parentTask);
    }

    return taskRepository.findById(task._id);
  }

  /**
   * Tự động tính toán lại tiến độ của công việc cha (Epic)
   */
  async recalculateParentProgress(parentId) {
    const Task = require('./task.model');
    const subtasks = await Task.find({ parentTask: parentId, isDeleted: false });
    
    if (subtasks.length === 0) return;
    
    const totalProgress = subtasks.reduce((sum, t) => sum + (t.progress || 0), 0);
    const avgProgress = Math.round(totalProgress / subtasks.length);
    
    let status = 'doing';
    if (avgProgress === 0) status = 'todo';
    if (avgProgress === 100) status = 'done';
    
    await Task.findByIdAndUpdate(parentId, { 
      progress: avgProgress,
      status: status,
      completedAt: avgProgress === 100 ? new Date() : null
    });
  }

  /**
   * Update task (PM/Admin only)
   */
  async updateTask(id, data, user) {
    const task = await taskRepository.findById(id);
    if (!task) throw new AppError('Task not found', 404);

    if (user.role === 'employee') {
      throw new AppError('Employees cannot edit task details', 403);
    }

    // Deadline validation
    if (data.deadline && new Date(data.deadline) < new Date()) {
      throw new AppError('Deadline cannot be in the past', 400);
    }

    const updated = await taskRepository.updateById(id, data);

    await logService.createLog({
      action: 'task_updated',
      performedBy: user._id,
      targetType: 'Task',
      targetId: id,
      targetName: task.title,
      project: task.project._id,
      changes: { before: task.toObject(), after: updated.toObject() },
      description: `Task "${task.title}" updated`,
    });

    if (data.sendEmail && data.assignedTo) {
      userRepository.findById(data.assignedTo).then(assignee => {
        if (assignee && assignee.email) {
          emailService.sendTaskNotificationEmail(
            assignee.email,
            data.title || task.title,
            user.name,
            data.deadline || task.deadline,
            data.priority || task.priority
          );
        }
      }).catch(err => console.error('Error fetching user for email:', err));
    }

    return updated;
  }

  /**
   * Assign task — PM/Admin only
   */
  async assignTask(id, assignedTo, user) {
    if (user.role === 'employee') {
      throw new AppError('Only PM or Admin can assign tasks', 403);
    }

    const task = await taskRepository.findById(id);
    if (!task) throw new AppError('Task not found', 404);

    const updated = await taskRepository.updateById(id, {
      assignedTo: assignedTo || null,
      assignedBy: assignedTo ? user._id : null,
    });

    if (assignedTo) {
      await notificationService.createNotification({
        recipient: assignedTo,
        sender: user._id,
        type: 'task_assigned',
        title: 'Công việc mới được giao',
        message: `Bạn vừa được phân công thực hiện công việc "${task.title}"`,
        relatedTask: id,
        relatedProject: task.project._id,
        link: `/tasks/${id}`,
      });

      // Send Email Notification
      userRepository.findById(assignedTo).then(assignee => {
        if (assignee && assignee.email) {
          emailService.sendTaskNotificationEmail(
            assignee.email,
            task.title,
            user.name,
            task.deadline,
            task.priority
          );
        }
      }).catch(err => console.error('Error fetching user for email:', err));

      await logService.createLog({
        action: 'task_assigned',
        performedBy: user._id,
        targetType: 'Task',
        targetId: id,
        targetName: task.title,
        project: task.project._id,
        description: `Task "${task.title}" assigned`,
      });
    }

    return updated;
  }

  /**
   * Change task status — only assignee can do this
   */
  async changeStatus(id, newStatus, progress, user) {
    const task = await taskRepository.findById(id);
    if (!task) throw new AppError('Task not found', 404);

    // Only assignee or admin/PM can change status
    if (
      user.role === 'employee' &&
      task.assignedTo?._id?.toString() !== user._id.toString()
    ) {
      throw new AppError('Only the assigned user can update task status', 403);
    }

    // Business rule: Todo -> Doing -> Review -> Done (no skipping)
    const statusOrder = ['todo', 'doing', 'review', 'done'];
    const currentIndex = statusOrder.indexOf(task.status);
    const newIndex = statusOrder.indexOf(newStatus);

    if (user.role === 'employee' && newIndex > currentIndex + 1) {
      throw new AppError('Cannot skip status: Todo → Doing → Review → Done', 400);
    }

    const updateData = { status: newStatus };

    // Force 100% progress on Done
    if (newStatus === 'done') {
      updateData.progress = 100;
      updateData.completedAt = new Date();
    } else if (progress !== undefined) {
      updateData.progress = progress;
    }

    const updated = await taskRepository.updateById(id, updateData);

    await logService.createLog({
      action: 'task_status_changed',
      performedBy: user._id,
      targetType: 'Task',
      targetId: id,
      targetName: task.title,
      project: task.project._id,
      changes: { before: { status: task.status }, after: { status: newStatus } },
      description: `Task "${task.title}" status changed: ${task.status} → ${newStatus}`,
    });

    // Notify task participants about status change
    try {
      const statusLabels = {
        todo: 'Cần làm',
        doing: 'Đang thực hiện',
        review: 'Chờ duyệt',
        done: 'Hoàn thành',
      };
      const recipients = new Set();
      if (task.assignedTo) recipients.add(task.assignedTo._id ? task.assignedTo._id.toString() : task.assignedTo.toString());
      if (task.createdBy) recipients.add(task.createdBy._id ? task.createdBy._id.toString() : task.createdBy.toString());
      if (task.assignedBy) recipients.add(task.assignedBy._id ? task.assignedBy._id.toString() : task.assignedBy.toString());

      recipients.delete(user._id.toString());

      for (const recipientId of recipients) {
        await notificationService.createNotification({
          recipient: recipientId,
          sender: user._id,
          type: 'task_status_changed',
          title: 'Trạng thái công việc thay đổi',
          message: `${user.name} đã chuyển trạng thái công việc "${task.title}" sang "${statusLabels[newStatus] || newStatus}"`,
          relatedTask: task._id,
          relatedProject: task.project?._id || task.project,
          link: `/tasks/${task._id}`,
        });
      }
    } catch (notifErr) {
      console.error('Error notifying status change:', notifErr);
    }

    if (task.parentTask) {
      await this.recalculateParentProgress(task.parentTask);
    }

    return updated;
  }

  /**
   * Update task progress
   */
  async updateProgress(id, progress, user) {
    const task = await taskRepository.findById(id);
    if (!task) throw new AppError('Task not found', 404);

    if (
      user.role === 'employee' &&
      task.assignedTo?._id?.toString() !== user._id.toString()
    ) {
      throw new AppError('Only the assigned user can update progress', 403);
    }

    const updateData = { progress };

    // Auto-update status based on progress
    if (progress === 100 && task.status !== 'done') {
      updateData.status = 'done';
      updateData.completedAt = new Date();
    } else if (progress > 0 && task.status === 'todo') {
      updateData.status = 'doing';
    }

    const updated = await taskRepository.updateById(id, updateData);

    await logService.createLog({
      action: 'task_progress_updated',
      performedBy: user._id,
      targetType: 'Task',
      targetId: id,
      targetName: task.title,
      project: task.project._id,
      description: `Task "${task.title}" progress updated to ${progress}%`,
    });

    if (task.parentTask) {
      await this.recalculateParentProgress(task.parentTask);
    }

    return updated;
  }

  /**
   * Delete task (soft delete)
   */
  async deleteTask(id, user) {
    const task = await taskRepository.findById(id);
    if (!task) throw new AppError('Task not found', 404);

    if (user.role === 'employee') {
      throw new AppError('Employees cannot delete tasks', 403);
    }

    await taskRepository.softDelete(id);

    await logService.createLog({
      action: 'task_deleted',
      performedBy: user._id,
      targetType: 'Task',
      targetId: id,
      targetName: task.title,
      project: task.project._id,
      description: `Task "${task.title}" deleted`,
    });
  }

  async getMyTasks(query, user) {
    const { page, limit, skip } = parsePagination(query);
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.assignedTeam) filter.assignedTeam = query.assignedTeam;
    
    if (query.parentTask !== undefined) {
      if (query.parentTask === 'null' || query.parentTask === null) {
        filter.parentTask = null;
      } else {
        filter.parentTask = query.parentTask;
      }
    }

    let tasks, total;
    if (user.role === 'employee') {
      tasks = await taskRepository.getUserTasks(user._id, filter, {
        skip,
        limit,
        sort: query.sort || 'deadline',
      });
      total = await taskRepository.count({ assignedTo: user._id, ...filter });
    } else {
      tasks = await taskRepository.findAll(filter, {
        skip,
        limit,
        sort: query.sort || 'deadline',
      });
      total = await taskRepository.count(filter);
    }

    return { tasks, pagination: buildPaginationMeta(total, page, limit) };
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(user) {
    const userId = user.role === 'employee' ? user._id : null;
    return taskRepository.getOverdueTasks(userId);
  }
  /**
   * Nhắc nhở công việc qua email
   */
  async remindTask(id, user) {
    const task = await taskRepository.findById(id);
    if (!task) throw new AppError('Task not found', 404);
    
    if (!task.assignedTo) {
      throw new AppError('Công việc này chưa được giao cho ai', 400);
    }

    if (!task.assignedTo.email) {
      throw new AppError('Không tìm thấy email của nhân viên phụ trách', 404);
    }

    const success = await emailService.sendTaskReminderEmail(
      task.assignedTo.email,
      task.title,
      user.name,
      task.deadline,
      task.priority
    );

    if (!success) {
      throw new AppError('Gửi email nhắc nhở thất bại', 500);
    }

    await logService.createLog({
      action: 'task_reminded',
      performedBy: user._id,
      targetType: 'Task',
      targetId: id,
      targetName: task.title,
      project: task.project._id || task.project,
      description: `Gửi email nhắc nhở cho "${task.assignedTo.name}" về công việc "${task.title}"`,
    });

    return true;
  }
}

module.exports = new TaskService();
