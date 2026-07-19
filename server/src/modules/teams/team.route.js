const express = require('express');
const router = express.Router();
const teamController = require('./team.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createTeamSchema, updateTeamSchema } = require('./team.validation');

router.use(authenticate);

router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeamById);

// Chỉ Admin và PM mới có quyền quản lý nhóm
router.use(authorize('admin', 'project_manager'));

router.post('/', validate(createTeamSchema), teamController.createTeam);
router.put('/:id', validate(updateTeamSchema), teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

module.exports = router;
