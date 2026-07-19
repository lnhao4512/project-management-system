const Comment = require('./comment.model');

class CommentService {
  async getTaskComments(taskId) {
    // Get top-level comments with their replies
    const comments = await Comment.find({ task: taskId, parentComment: null })
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email')
      .populate({
        path: 'replies',
        populate: [
          { path: 'author', select: 'name email avatar' },
          { path: 'mentions', select: 'name email' },
        ],
        match: { isDeleted: false },
      })
      .sort({ createdAt: 1 });

    return comments;
  }

  async createComment(data, user) {
    const comment = await Comment.create({
      ...data,
      author: user._id,
    });

    return Comment.findById(comment._id)
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email');
  }

  async updateComment(commentId, content, userId) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Comment not found');
    if (comment.author.toString() !== userId.toString()) {
      throw new Error('You can only edit your own comments');
    }

    return Comment.findByIdAndUpdate(
      commentId,
      { content, isEdited: true, editedAt: new Date() },
      { new: true }
    ).populate('author', 'name email avatar');
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
