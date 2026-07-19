const express = require('express');
const router = express.Router();
const projectController = require('./project.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isAdminOrPM } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  listProjectsSchema,
} = require('./project.validation');

router.use(authenticate);

router.get('/', validate(listProjectsSchema), projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', isAdminOrPM, validate(createProjectSchema), projectController.createProject);
router.put('/:id', isAdminOrPM, validate(updateProjectSchema), projectController.updateProject);
router.delete('/:id', isAdminOrPM, projectController.deleteProject);

// Members
router.post('/:id/members', isAdminOrPM, validate(addMemberSchema), projectController.addMember);
router.delete('/:id/members/:userId', isAdminOrPM, projectController.removeMember);

module.exports = router;
