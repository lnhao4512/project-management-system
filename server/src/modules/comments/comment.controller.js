const commentService = require('./comment.service');
const ApiResponse = require('../../utils/apiResponse');
const AppError = require('../../utils/appError');

class CommentController {
  async getTaskComments(req, res, next) {
    try {
      const comments = await commentService.getTaskComments(req.params.taskId);
      return ApiResponse.success(res, comments);
    } catch (error) {
      next(error);
    }
  }

  async createComment(req, res, next) {
    try {
      const data = { ...req.body, task: req.params.taskId };
      if (req.files && req.files.length > 0) {
        data.attachments = req.files.map(f => `/uploads/${f.filename}`);
      }
      const comment = await commentService.createComment(data, req.user);
      if (req.io) {
        req.io.to(`task:${req.params.taskId}`).emit('comment:new', comment);
      }
      return ApiResponse.created(res, comment, 'Comment added');
    } catch (error) {
      next(error instanceof AppError ? error : new AppError(error.message, 400));
    }
  }

  async updateComment(req, res, next) {
    try {
      const comment = await commentService.updateComment(
        req.params.id,
        req.body.content,
        req.user._id
      );
      if (req.io) {
        req.io.to(`task:${req.params.taskId}`).emit('comment:updated', comment);
      }
      return ApiResponse.success(res, comment, 'Comment updated');
    } catch (error) {
      next(error instanceof AppError ? error : new AppError(error.message, 400));
    }
  }

  async deleteComment(req, res, next) {
    try {
      await commentService.deleteComment(req.params.id, req.user._id, req.user.role);
      if (req.io) {
        req.io.to(`task:${req.params.taskId}`).emit('comment:deleted', req.params.id);
      }
      return ApiResponse.success(res, null, 'Comment deleted');
    } catch (error) {
      next(error instanceof AppError ? error : new AppError(error.message, 400));
    }
  }
}

module.exports = new CommentController();
