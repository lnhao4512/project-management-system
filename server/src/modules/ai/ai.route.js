const express = require('express');
const router = express.Router();
const aiService = require('./ai.service');
const { authenticate } = require('../../middlewares/auth.middleware');
const ApiResponse = require('../../utils/apiResponse');

router.use(authenticate);

/**
 * GET /api/v1/ai/suggest
 * Returns AI-ranked task suggestions for the current user
 * Query: ?limit=5
 */
router.get('/suggest', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 10);
    const result = await aiService.getSuggestedTasks(req.user, limit);
    return ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
