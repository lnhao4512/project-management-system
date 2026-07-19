require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const Task = require('./modules/tasks/task.model');
const User = require('./modules/users/user.model');
const Project = require('./modules/projects/project.model'); // Need to find a project

const seedReviewTasks = async () => {
  try {
    await connectDB();
    console.log('Connected to DB');

    // Find admin user
    const admin = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@company.com' });
    if (!admin) {
      console.log('Admin user not found. Run seed.js first.');
      process.exit(1);
    }

    // Find any project or create one if none exists
    let project = await Project.findOne();
    if (!project) {
      project = await Project.create({
        name: 'Dự án Mẫu',
        description: 'Dự án tự động tạo',
        status: 'active',
        priority: 'medium',
        manager: admin._id,
        createdBy: admin._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      console.log('Created a dummy project');
    }

    // Create a few review tasks
    const tasks = [
      {
        title: 'Kiểm tra tài liệu kĩ thuật',
        description: 'Xem xét và đánh giá tài liệu API trước khi gửi cho khách hàng.',
        status: 'review',
        priority: 'high',
        progress: 95,
        project: project._id,
        assignedTo: admin._id,
        createdBy: admin._id,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // +2 days
      },
      {
        title: 'Đánh giá code Module Thanh toán',
        description: 'Review code cho tính năng tích hợp VNPay.',
        status: 'review',
        priority: 'medium',
        progress: 90,
        project: project._id,
        assignedTo: admin._id,
        createdBy: admin._id,
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // +1 day
      }
    ];

    await Task.insertMany(tasks);
    console.log('Added 2 review tasks successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding tasks:', err);
    process.exit(1);
  }
};

seedReviewTasks();
