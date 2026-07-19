const cron = require('node-cron');
const Task = require('../modules/tasks/task.model');
const Notification = require('../modules/notifications/notification.model');
const NotificationService = require('../modules/notifications/notification.service');

class CronService {
  init() {
    // Chạy vào 8:00 sáng mỗi ngày: '0 8 * * *'
    cron.schedule('0 8 * * *', async () => {
      console.log('[CronJob] Running daily deadline check...');
      try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);
        const startOfToday = new Date(today);
        startOfToday.setHours(0, 0, 0, 0);

        // 1. Nhắc nhở sắp đến hạn (Deadline ngày mai)
        const upcomingTasks = await Task.find({
          status: { $ne: 'done' },
          deadline: {
            $gte: today,
            $lte: tomorrow
          },
          isDeleted: false
        }).populate('assignedTo');

        let remindersCount = 0;
        for (const task of upcomingTasks) {
          if (task.assignedTo) {
            // Check for duplicates
            const existing = await Notification.findOne({
              recipient: task.assignedTo._id,
              type: 'task_deadline_warning',
              relatedTask: task._id
            });
            
            if (!existing) {
              await NotificationService.createNotification({
                recipient: task.assignedTo._id,
                sender: task.createdBy, 
                type: 'task_deadline_warning', 
                title: 'Cảnh báo hạn chót!',
                message: `Công việc "${task.title}" của bạn sẽ đến hạn vào ngày mai. Vui lòng kiểm tra!`,
                relatedTask: task._id,
                relatedProject: task.project,
                link: `/tasks/${task._id}`
              });
              remindersCount++;
            }
          }
        }

        // 2. Thông báo quá hạn (Deadline đã qua)
        const overdueTasks = await Task.find({
          status: { $ne: 'done' },
          deadline: { $lt: startOfToday },
          isDeleted: false
        }).populate('assignedTo');

        let overdueCount = 0;
        for (const task of overdueTasks) {
          if (task.assignedTo) {
            // Check for duplicates
            const existing = await Notification.findOne({
              recipient: task.assignedTo._id,
              type: 'task_overdue',
              relatedTask: task._id
            });
            
            if (!existing) {
              await NotificationService.createNotification({
                recipient: task.assignedTo._id,
                sender: task.createdBy, 
                type: 'task_overdue', 
                title: 'Công việc quá hạn!',
                message: `Công việc "${task.title}" đã quá hạn. Vui lòng cập nhật tiến độ ngay!`,
                relatedTask: task._id,
                relatedProject: task.project,
                link: `/tasks/${task._id}`
              });
              overdueCount++;
            }
          }
        }

        console.log(`[CronJob] Sent ${remindersCount} deadline reminders and ${overdueCount} overdue warnings.`);
      } catch (error) {
        console.error('[CronJob] Error checking deadlines:', error);
      }
    });
  }
}

module.exports = new CronService();
