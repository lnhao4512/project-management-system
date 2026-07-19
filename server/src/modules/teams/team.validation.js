const Joi = require('joi');

const createTeamSchema = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow('', null),
    leader: Joi.string().required(),
    members: Joi.array().items(Joi.string()).default([]),
  }),
};

const updateTeamSchema = {
  body: Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().allow('', null).optional(),
    leader: Joi.string().optional(),
    members: Joi.array().items(Joi.string()).optional(),
  }),
};

module.exports = {
  createTeamSchema,
  updateTeamSchema,
};
