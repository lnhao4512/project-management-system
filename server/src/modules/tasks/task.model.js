const mongoose = require('mongoose');
require('../attachments/attachment.model');
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['todo', 'doing', 'review', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    progress: {
      type: Number,
      min: [0, 'Progress cannot be less than 0'],
      max: [100, 'Progress cannot exceed 100'],
      default: 0,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deadline: {
      type: Date,
      default: null,
    },
    startDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    actualHours: {
      type: Number,
      min: 0,
      default: null,
    },
    tags: [{ type: String, trim: true }],
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attachment',
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
taskSchema.index({ title: 'text', description: 'text' });
taskSchema.index({ project: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ isDeleted: 1 });
taskSchema.index({ createdBy: 1 });

// Virtual: isOverdue
taskSchema.virtual('isOverdue').get(function () {
  if (!this.deadline) return false;
  return this.deadline < new Date() && this.status !== 'done';
});

// Business rule: status transition validation
taskSchema.pre('save', function () {
  // Task Done must have 100% progress
  if (this.status === 'done' && this.progress !== 100) {
    this.progress = 100;
    this.completedAt = new Date();
  }
  // Todo cannot directly become Done (handled at service level)
});

// Soft delete filter
taskSchema.pre(/^find/, function () {
  if (!this._skipDeletedFilter) {
    this.where({ isDeleted: false });
  }
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
