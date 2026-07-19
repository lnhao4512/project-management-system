const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { isAdmin, isAdminOrPM } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { upload } = require('../../middlewares/upload.middleware');
const { createUserSchema, updateUserSchema, listUsersSchema } = require('./user.validation');

// All routes require authentication
router.use(authenticate);

// Profile routes (self)
router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateUserSchema), userController.updateProfile);
router.put('/profile/avatar', upload.single('avatar'), userController.updateAvatar);

// Admin/PM routes
router.get('/', isAdminOrPM, validate(listUsersSchema), userController.getAllUsers);
router.get('/:id', isAdminOrPM, userController.getUserById);
router.post('/', isAdminOrPM, validate(createUserSchema), userController.createUser);
router.put('/:id', isAdminOrPM, validate(updateUserSchema), userController.updateUser);
router.delete('/:id', isAdminOrPM, userController.deleteUser);

module.exports = router;
