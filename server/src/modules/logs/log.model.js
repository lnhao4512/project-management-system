const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'task_created',
        'task_updated',
        'task_deleted',
        'task_status_changed',
        'task_assigned',
        'task_progress_updated',
        'task_priority_changed',
        'task_reminded',
        'project_created',
        'project_updated',
        'project_deleted',
        'project_member_added',
        'project_member_removed',
        'comment_created',
        'comment_deleted',
        'attachment_uploaded',
        'attachment_deleted',
        'user_created',
        'user_updated',
        'user_deleted',
        'login',
        'logout',
      ],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: ['Task', 'Project', 'User', 'Comment', 'Attachment'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetName: {
      type: String,
      default: '',
    },
    changes: {
      before: { type: mongoose.Schema.Types.Mixed, default: null },
      after: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    description: {
      type: String,
      maxlength: 500,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
logSchema.index({ performedBy: 1 });
logSchema.index({ targetType: 1, targetId: 1 });
logSchema.index({ project: 1 });
logSchema.index({ createdAt: -1 });
logSchema.index({ action: 1 });

const Log = mongoose.model('Log', logSchema);
module.exports = Log;
