const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('./comment.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { upload, handleMulterError } = require('../../middlewares/upload.middleware');

router.use(authenticate);

router.get('/', commentController.getTaskComments);
router.post('/', upload.array('attachments', 5), handleMulterError, commentController.createComment);
router.put('/:id', commentController.updateComment);
router.delete('/:id', commentController.deleteComment);

module.exports = router;
