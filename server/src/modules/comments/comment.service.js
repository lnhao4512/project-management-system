const Comment = require('./comment.model');
const notificationService = require('../notifications/notification.service');
const logService = require('../logs/log.service');
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

    // Notify task participants & mentioned users
    try {
      const task = await Task.findById(data.task).populate('project');
      if (task) {
        const shortContent = (data.content || '').length > 60
          ? (data.content || '').substring(0, 60) + '...'
          : (data.content || '');

        const currentUserIdStr = user._id.toString();
        const mentionedIdsStrSet = new Set();

        // 1. Notify mentioned users
        if (Array.isArray(mentions) && mentions.length > 0) {
          for (const targetUserId of mentions) {
            const targetIdStr = targetUserId?._id ? targetUserId._id.toString() : targetUserId?.toString();
            if (targetIdStr && targetIdStr !== currentUserIdStr) {
              mentionedIdsStrSet.add(targetIdStr);
              await notificationService.createNotification({
                recipient: targetIdStr,
                sender: user._id,
                type: 'mention',
                title: 'Bạn được nhắc đến trong bình luận',
                message: `${user.name} đã nhắc đến bạn trong công việc "${task.title}": "${shortContent}"`,
                relatedTask: task._id,
                relatedProject: task.project?._id || task.project,
                link: `/tasks/${task._id}`,
              });
            }
          }
        }

        // 2. Identify all task participants
        const participantIdsSet = new Set();

        // Người được giao việc (Assignee)
        if (task.assignedTo) {
          const id = task.assignedTo._id ? task.assignedTo._id.toString() : task.assignedTo.toString();
          participantIdsSet.add(id);
        }
        // Người tạo công việc (Creator)
        if (task.createdBy) {
          const id = task.createdBy._id ? task.createdBy._id.toString() : task.createdBy.toString();
          participantIdsSet.add(id);
        }
        // Người giao việc (Assignor)
        if (task.assignedBy) {
          const id = task.assignedBy._id ? task.assignedBy._id.toString() : task.assignedBy.toString();
          participantIdsSet.add(id);
        }

        // Những người đã từng bình luận trong công việc này
        const prevComments = await Comment.find({ task: data.task, isDeleted: false }).select('author');
        for (const c of prevComments) {
          if (c.author) {
            const authorId = c.author._id ? c.author._id.toString() : c.author.toString();
            participantIdsSet.add(authorId);
          }
        }

        // Loại trừ chính người vừa viết bình luận
        participantIdsSet.delete(currentUserIdStr);

        // Loại trừ những người đã nhận thông báo mention ở bước 1 để tránh gửi trùng
        for (const mId of mentionedIdsStrSet) {
          participantIdsSet.delete(mId);
        }

        // 3. Gửi thông báo "Có bình luận mới" cho tất cả người tham gia còn lại
        for (const participantId of participantIdsSet) {
          await notificationService.createNotification({
            recipient: participantId,
            sender: user._id,
            type: 'task_commented',
            title: 'Có bình luận mới',
            message: `${user.name} đã bình luận trong công việc "${task.title}": "${shortContent}"`,
            relatedTask: task._id,
            relatedProject: task.project?._id || task.project,
            link: `/tasks/${task._id}`,
          });
        }

        // 4. Ghi log hoạt động
        await logService.createLog({
          action: 'comment_created',
          performedBy: user._id,
          targetType: 'Task',
          targetId: task._id,
          targetName: task.title,
          project: task.project?._id || task.project,
          description: `${user.name} đã bình luận trên công việc "${task.title}"`,
        });
      }
    } catch (notifErr) {
      console.error('Error sending comment notifications:', notifErr);
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

    const updated = await Comment.findByIdAndUpdate(commentId, { isDeleted: true }, { new: true });
    try {
      await logService.createLog({
        action: 'comment_deleted',
        performedBy: userId,
        targetType: 'Comment',
        targetId: commentId,
        targetName: 'Bình luận',
        description: `Bình luận đã bị xóa`,
      });
    } catch (e) {
      console.error('Log error on comment delete:', e);
    }
    return updated;
  }
}

module.exports = new CommentService();
