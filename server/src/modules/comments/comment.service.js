const Comment = require('./comment.model');
const notificationService = require('../notifications/notification.service');
const Task = require('../tasks/task.model');

class CommentService {
  async getTaskComments(taskId) {
    // Get top-level comments with their replies
    const comments = await Comment.find({ task: taskId, parentComment: null })
      .populate('author', 'name email avatar role')
      .populate('mentions', 'name email avatar role')
      .populate({
        path: 'replies',
        populate: [
          { path: 'author', select: 'name email avatar role' },
          { path: 'mentions', select: 'name email avatar role' },
        ],
        match: { isDeleted: false },
      })
      .sort({ createdAt: 1 });

    return comments;
  }

  async createComment(data, user) {
    let mentions = data.mentions || [];
    if (typeof mentions === 'string') {
      try {
        mentions = JSON.parse(mentions);
      } catch (e) {
        mentions = mentions.split(',').map(m => m.trim()).filter(Boolean);
      }
    }

    const comment = await Comment.create({
      ...data,
      mentions,
      author: user._id,
    });

    const populated = await Comment.findById(comment._id)
      .populate('author', 'name email avatar role')
      .populate('mentions', 'name email avatar role');

    // Notify mentioned users
    try {
      if (Array.isArray(mentions) && mentions.length > 0) {
        const task = await Task.findById(data.task).populate('project');
        for (const targetUserId of mentions) {
          if (targetUserId && targetUserId.toString() !== user._id.toString()) {
            const shortContent = (data.content || '').length > 60
              ? (data.content || '').substring(0, 60) + '...'
              : (data.content || '');

            await notificationService.createNotification({
              recipient: targetUserId,
              sender: user._id,
              type: 'mention',
              title: 'Bạn được nhắc đến trong bình luận',
              message: `${user.name} đã nhắc đến bạn trong công việc "${task ? task.title : 'công việc'}": "${shortContent}"`,
              relatedTask: data.task,
              relatedProject: task?.project?._id || task?.project,
              link: `/tasks/${data.task}`,
            });
          }
        }
      }
    } catch (notifErr) {
      console.error('Error sending mention notification:', notifErr);
    }

    return populated;
  }

  async updateComment(commentId, content, userId, mentionsData) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Comment not found');
    if (comment.author.toString() !== userId.toString()) {
      throw new Error('You can only edit your own comments');
    }

    const updatePayload = { content, isEdited: true, editedAt: new Date() };
    if (mentionsData !== undefined) {
      let mentions = mentionsData;
      if (typeof mentions === 'string') {
        try {
          mentions = JSON.parse(mentions);
        } catch (e) {
          mentions = mentions.split(',').map(m => m.trim()).filter(Boolean);
        }
      }
      updatePayload.mentions = mentions;
    }

    return Comment.findByIdAndUpdate(
      commentId,
      updatePayload,
      { new: true }
    )
      .populate('author', 'name email avatar role')
      .populate('mentions', 'name email avatar role');
  }

  async deleteComment(commentId, userId, userRole) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Comment not found');

    const isOwner = comment.author.toString() === userId.toString();
    const isAdmin = ['admin', 'project_manager'].includes(userRole);

    if (!isOwner && !isAdmin) {
      throw new Error('Permission denied');
    }

    return Comment.findByIdAndUpdate(commentId, { isDeleted: true }, { new: true });
  }
}

module.exports = new CommentService();
