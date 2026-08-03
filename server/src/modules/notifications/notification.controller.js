const notificationService = require('./notification.service');
const ApiResponse = require('../../utils/apiResponse');
const { parsePagination, buildPaginationMeta } = require('../../utils/helpers');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const { page, limit } = parsePagination(req.query);
      const { type, isRead } = req.query;
      const result = await notificationService.getUserNotifications(req.user._id, page, limit, { type, isRead });
      return ApiResponse.paginated(
        res,
        result.notifications,
        buildPaginationMeta(result.total, page, limit),
        'Notifications retrieved'
      );
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const notification = await notificationService.markAsRead(req.params.id, req.user._id);
      return ApiResponse.success(res, notification, 'Marked as read');
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user._id);
      return ApiResponse.success(res, null, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      await notificationService.deleteNotification(req.params.id, req.user._id);
      return ApiResponse.success(res, null, 'Notification deleted');
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const count = await notificationService.getUnreadCount(req.user._id);
      return ApiResponse.success(res, { count });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
