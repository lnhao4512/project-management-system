require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const Task = require('./modules/tasks/task.model');
const User = require('./modules/users/user.model');
const Project = require('./modules/projects/project.model');

const seedRealTasks = async () => {
  try {
    await connectDB();
    console.log('Connected to DB');

    const admin = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@company.com' });
    if (!admin) {
      console.log('Admin user not found.');
      process.exit(1);
    }

    let project = await Project.findOne();
    if (!project) {
      console.log('Project not found.');
      process.exit(1);
    }

    // 1. Xóa các task dummy vừa tạo
    const dummyTitles = ['Kiểm tra tài liệu kĩ thuật', 'Đánh giá code Module Thanh toán'];
    await Task.deleteMany({ title: { $in: dummyTitles } });
    console.log('Deleted dummy tasks');

    // 2. Thêm các task thật và thực tế cho khâu "Chờ duyệt"
    const realTasks = [
      {
        title: 'Tối ưu hóa hiệu năng API truy xuất danh sách Sản phẩm',
        description: 'Đã hoàn thành việc thêm caching bằng Redis và viết lại Aggregation Pipeline cho MongoDB. Đang chờ Lead review lại logic cache invalidation trước khi merge.',
        status: 'review',
        priority: 'high',
        progress: 95,
        project: project._id,
        assignedTo: admin._id,
        createdBy: admin._id,
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // Mai
      },
      {
        title: 'Fix lỗi đăng nhập bằng Google (OAuth2)',
        description: 'Đã fix xong tình trạng token bị hết hạn nhưng không tự động refresh ở frontend. Đã đẩy code lên nhánh fix/google-oauth. Cần review lại flow bảo mật.',
        status: 'review',
        priority: 'high',
        progress: 100,
        project: project._id,
        assignedTo: admin._id,
        createdBy: admin._id,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // Mốt
      },
      {
        title: 'Kiểm thử tích hợp (Integration Test) cho luồng Thanh toán',
        description: 'Đã viết xong 25 test cases cover luồng thanh toán qua VNPay và MoMo. Test chạy pass 100% trên môi trường dev. Chờ QA review lại các edge cases.',
        status: 'review',
        priority: 'medium',
        progress: 90,
        project: project._id,
        assignedTo: admin._id,
        createdBy: admin._id,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) 
      }
    ];

    await Task.insertMany(realTasks);
    console.log('Added real tasks successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding tasks:', err);
    process.exit(1);
  }
};

seedRealTasks();
