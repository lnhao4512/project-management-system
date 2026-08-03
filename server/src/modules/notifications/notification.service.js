const Notification = require('./notification.model');
const { emitToUser } = require('../../sockets/socket');

let _io = null;

class NotificationService {
  setIo(io) {
    _io = io;
  }

  async createNotification(data) {
    try {
      const notification = await Notification.create(data);
      const populated = await Notification.findById(notification._id)
        .populate('sender', 'name avatar role')
        .populate('relatedTask', 'title status priority deadline')
        .populate('relatedProject', 'name');

      // Emit realtime notification
      if (_io) {
        emitToUser(_io, data.recipient, 'notification:new', populated || notification);
      }
      return populated || notification;
    } catch (error) {
      console.error('Notification creation error:', error.message);
    }
  }

  async getUserNotifications(userId, page = 1, limit = 20, options = {}) {
    const skip = (page - 1) * limit;
    const filter = { recipient: userId };

    if (options.type && options.type !== 'all') {
      if (options.type === 'comment_mention') {
        filter.type = { $in: ['task_commented', 'mention'] };
      } else if (options.type === 'task_activity') {
        filter.type = { $in: ['task_assigned', 'task_updated', 'task_status_changed'] };
      } else if (options.type === 'deadline') {
        filter.type = { $in: ['task_deadline_warning', 'task_overdue'] };
      } else if (options.type === 'project') {
        filter.type = { $in: ['project_member_added', 'project_updated'] };
      } else {
        filter.type = options.type;
      }
    }

    if (options.isRead !== undefined && options.isRead !== null && options.isRead !== '') {
      filter.isRead = options.isRead === 'true' || options.isRead === true;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('sender', 'name avatar role')
        .populate('relatedTask', 'title status priority deadline')
        .populate('relatedProject', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);
    return { notifications, total, unreadCount };
  }

  async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    return Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  async deleteNotification(notificationId, userId) {
    return Notification.findOneAndDelete({ _id: notificationId, recipient: userId });
  }

  async getUnreadCount(userId) {
    return Notification.countDocuments({ recipient: userId, isRead: false });
  }

  /**
   * Send deadline warning notifications (run as cron job)
   */
  async sendDeadlineWarnings() {
    const Task = require('../tasks/task.model');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const urgentTasks = await Task.find({
      deadline: { $gte: new Date(), $lte: dayAfter },
      status: { $ne: 'done' },
      assignedTo: { $ne: null },
    }).populate('assignedTo', '_id name');

    for (const task of urgentTasks) {
      const hoursUntilDeadline = Math.floor(
        (new Date(task.deadline) - new Date()) / (1000 * 60 * 60)
      );
      await this.createNotification({
        recipient: task.assignedTo._id,
        type: 'task_deadline_warning',
        title: 'Cảnh báo hạn chót',
        message: `Công việc "${task.title}" sẽ đến hạn trong ${hoursUntilDeadline} giờ tới`,
        relatedTask: task._id,
        relatedProject: task.project,
        link: `/tasks/${task._id}`,
      });
    }
  }
}

module.exports = new NotificationService();
