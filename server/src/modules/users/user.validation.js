const Joi = require('joi');

const createUserSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .max(20)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s])(?!.*\s).*$/)
      .optional()
      .messages({
        'string.pattern.base': 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt và không chứa khoảng trắng',
        'string.min': 'Mật khẩu phải có từ 8 đến 20 ký tự',
        'string.max': 'Mật khẩu phải có từ 8 đến 20 ký tự',
      }),
    role: Joi.string().valid('admin', 'project_manager', 'employee').default('employee'),
    department: Joi.string().max(100).optional().allow(''),
    position: Joi.string().max(100).optional().allow(''),
    phone: Joi.string().max(20).optional().allow(''),
  }),
};

const updateUserSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    department: Joi.string().max(100).optional().allow(''),
    position: Joi.string().max(100).optional().allow(''),
    phone: Joi.string().max(20).optional().allow(''),
    role: Joi.string().valid('admin', 'project_manager', 'employee').optional(),
    isActive: Joi.boolean().optional(),
  }),
};

const listUsersSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().optional().allow(''),
    role: Joi.string().valid('admin', 'project_manager', 'employee').optional(),
    isActive: Joi.boolean().optional(),
    sort: Joi.string().optional().default('-createdAt'),
  }),
};

module.exports = { createUserSchema, updateUserSchema, listUsersSchema };
