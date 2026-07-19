const Joi = require('joi');

const nameRegex = /^[a-zA-Z0-9ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ](?:[a-zA-Z0-9ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]*[a-zA-Z0-9ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ])?$/;

const createProjectSchema = {
  body: Joi.object({
    name: Joi.string().min(3).max(100).pattern(nameRegex).required().messages({
      'string.min': 'Tên dự án phải từ 3 đến 100 ký tự',
      'string.max': 'Tên dự án phải từ 3 đến 100 ký tự',
      'string.pattern.base': 'Tên dự án không đúng quy định',
    }),
    description: Joi.string().max(2000).optional().allow(''),
    status: Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled').default('planning'),
    priority: Joi.string().valid('high', 'medium', 'low').default('medium'),
    startDate: Joi.date().optional().allow(null),
    endDate: Joi.date().min(Joi.ref('startDate')).optional().allow(null),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
  }),
};

const updateProjectSchema = {
  body: Joi.object({
    name: Joi.string().min(3).max(100).pattern(nameRegex).optional().messages({
      'string.min': 'Tên dự án phải từ 3 đến 100 ký tự',
      'string.max': 'Tên dự án phải từ 3 đến 100 ký tự',
      'string.pattern.base': 'Tên dự án không đúng quy định',
    }),
    description: Joi.string().max(2000).optional().allow(''),
    status: Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled').optional(),
    priority: Joi.string().valid('high', 'medium', 'low').optional(),
    startDate: Joi.date().optional().allow(null),
    endDate: Joi.date().optional().allow(null),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
  }),
};

const addMemberSchema = {
  body: Joi.object({
    userId: Joi.string().required(),
    role: Joi.string().valid('project_manager', 'developer', 'designer', 'tester', 'viewer').default('developer'),
  }),
};

const listProjectsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().optional().allow(''),
    status: Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled').optional(),
    priority: Joi.string().valid('high', 'medium', 'low').optional(),
    sort: Joi.string().optional().default('-createdAt'),
  }),
};

module.exports = { createProjectSchema, updateProjectSchema, addMemberSchema, listProjectsSchema };
