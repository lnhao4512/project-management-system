const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const Task = require('../tasks/task.model');
const Project = require('../projects/project.model');
const User = require('../users/user.model');
const ApiResponse = require('../../utils/apiResponse');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return ApiResponse.success(res, { tasks: [], projects: [], users: [] });
    }

    const regex = new RegExp(q.trim(), 'i');
    const userFilter = req.user.role === 'employee' ? { assignedTo: req.user._id } : {};

    const [tasks, projects, users] = await Promise.all([
      Task.find({ isDeleted: false, ...userFilter, title: regex })
        .populate('project', 'name color')
        .select('title status priority deadline project')
        .limit(6),
      req.user.role !== 'employee'
        ? Project.find({ name: regex }).select('name color status').limit(5)
        : [],
      req.user.role !== 'employee'
        ? User.find({ isDeleted: false, name: regex }).select('name email role').limit(5)
        : [],
    ]);

    return ApiResponse.success(res, { tasks, projects, users });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
