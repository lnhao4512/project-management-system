const Joi = require('joi');

const createTaskSchema = {
  body: Joi.object({
    title: Joi.string().min(2).max(300).required(),
    description: Joi.string().max(5000).optional().allow(''),
    project: Joi.string().required(),
    priority: Joi.string().valid('high', 'medium', 'low').default('medium'),
    status: Joi.string().valid('todo', 'doing', 'review', 'done').default('todo'),
    assignedTo: Joi.string().optional().allow(null, ''),
    assignedTeam: Joi.string().optional().allow(null, ''),
    parentTask: Joi.string().optional().allow(null, ''),
    deadline: Joi.date().min('now').optional().allow(null).messages({
      'date.min': 'Deadline cannot be in the past',
    }),
    startDate: Joi.date().optional().allow(null),
    tags: Joi.array().items(Joi.string()).optional(),
  }),
};

const updateTaskSchema = {
  body: Joi.object({
    title: Joi.string().min(2).max(300).optional(),
    description: Joi.string().max(5000).optional().allow(''),
    priority: Joi.string().valid('high', 'medium', 'low').optional(),
    deadline: Joi.date().optional().allow(null),
    startDate: Joi.date().optional().allow(null),
    actualHours: Joi.number().min(0).optional().allow(null),
    tags: Joi.array().items(Joi.string()).optional(),
  }),
};

const updateStatusSchema = {
  body: Joi.object({
    status: Joi.string().valid('todo', 'doing', 'review', 'done').required(),
    progress: Joi.number().min(0).max(100).optional(),
  }),
};

const updateProgressSchema = {
  body: Joi.object({
    progress: Joi.number().integer().min(0).max(100).required(),
  }),
};

const assignTaskSchema = {
  body: Joi.object({
    assignedTo: Joi.string().optional().allow(null, ''),
    assignedTeam: Joi.string().optional().allow(null, ''),
  }),
};

const listTasksSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(1000).default(20),
    search: Joi.string().optional().allow(''),
    status: Joi.string().valid('todo', 'doing', 'review', 'done').optional(),
    priority: Joi.string().valid('high', 'medium', 'low').optional(),
    assignedTo: Joi.string().optional(),
    assignedTeam: Joi.string().optional(),
    parentTask: Joi.string().optional().allow(null, 'null'),
    project: Joi.string().optional(),
    overdue: Joi.boolean().optional(),
    sort: Joi.string().optional().default('-createdAt'),
  }),
};

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
  updateProgressSchema,
  assignTaskSchema,
  listTasksSchema,
};
