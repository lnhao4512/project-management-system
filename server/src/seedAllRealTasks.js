require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const Task = require('./modules/tasks/task.model');
const User = require('./modules/users/user.model');
const Project = require('./modules/projects/project.model');

const seedAllRealTasks = async () => {
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
      console.log('Project not found. Creating one...');
      project = await Project.create({
        name: 'Dự án Phát triển E-Commerce',
        description: 'Dự án phát triển nền tảng thương mại điện tử',
        status: 'active',
        priority: 'high',
        manager: admin._id,
        createdBy: admin._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      });
    }

    // Prepare a rich list of tasks
    const tasksData = [
      // TODO
      {
        title: 'Thiết kế hệ thống Database Schema',
        description: 'Lên sơ đồ thực thể liên kết (ERD) cho các bảng Users, Products, Orders, Payments.',
        status: 'todo',
        priority: 'high',
        progress: 0,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Cấu hình CI/CD Pipeline với GitHub Actions',
        description: 'Thiết lập workflow tự động lint, test và deploy lên môi trường staging.',
        status: 'todo',
        priority: 'medium',
        progress: 0,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Tích hợp Elasticsearch cho tính năng tìm kiếm',
        description: 'Setup cluster và viết service sync data từ MongoDB qua Elasticsearch.',
        status: 'todo',
        priority: 'high',
        progress: 10,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Viết tài liệu API (Swagger)',
        description: 'Cập nhật tài liệu API cho module quản lý đơn hàng.',
        status: 'todo',
        priority: 'low',
        progress: 0,
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Triển khai kiến trúc Microservices',
        description: 'Tách service thanh toán ra khỏi monolithic backend.',
        status: 'todo',
        priority: 'high',
        progress: 0,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      },

      // DOING
      {
        title: 'Phát triển giao diện Dashboard Admin',
        description: 'Dựng layout, sidebar, header và các biểu đồ thống kê cơ bản bằng React và Chart.js.',
        status: 'doing',
        priority: 'high',
        progress: 45,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Tích hợp cổng thanh toán VNPay',
        description: 'Viết API tạo URL thanh toán và xử lý IPN webhook.',
        status: 'doing',
        priority: 'high',
        progress: 60,
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Tối ưu hóa hình ảnh tải lên',
        description: 'Sử dụng sharp để resize và nén ảnh trước khi upload lên AWS S3.',
        status: 'doing',
        priority: 'medium',
        progress: 80,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Xây dựng tính năng Real-time Chat',
        description: 'Sử dụng Socket.io để làm chức năng hỗ trợ khách hàng trực tuyến.',
        status: 'doing',
        priority: 'medium',
        progress: 30,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },

      // REVIEW
      {
        title: 'Hoàn thiện chức năng Giỏ hàng',
        description: 'Đã xử lý logic cộng trừ số lượng, validate tồn kho. Chờ QA test lại các edge case.',
        status: 'review',
        priority: 'high',
        progress: 95,
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // Quá hạn 1 ngày
      },
      {
        title: 'Bảo mật: Phân quyền Role-based Access Control (RBAC)',
        description: 'Đã thêm middleware phân quyền cho toàn bộ API. Chờ Tech Lead review code.',
        status: 'review',
        priority: 'high',
        progress: 100,
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Refactor cấu trúc Redux Store',
        description: 'Đã chuyển đổi sang Redux Toolkit và tối ưu re-render. Chờ review.',
        status: 'review',
        priority: 'medium',
        progress: 100,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Xử lý lỗi rò rỉ bộ nhớ (Memory Leak)',
        description: 'Đã fix lỗi leak trên Node.js server. Chờ monitor thêm trên môi trường staging.',
        status: 'review',
        priority: 'low',
        progress: 90,
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
      },

      // DONE
      {
        title: 'Khởi tạo dự án và setup môi trường',
        description: 'Setup Node.js, Express, React, Vite, Tailwind CSS.',
        status: 'done',
        priority: 'high',
        progress: 100,
        deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Thiết kế UI/UX Wireframe',
        description: 'Đã chốt xong bản thiết kế với team Business.',
        status: 'done',
        priority: 'high',
        progress: 100,
        deadline: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Chức năng Đăng nhập / Đăng ký',
        description: 'Xử lý JWT, mã hóa password bằng bcrypt.',
        status: 'done',
        priority: 'high',
        progress: 100,
        deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Cấu hình Docker Compose',
        description: 'Setup Redis, MongoDB, và app để chạy mượt mà trên môi trường dev.',
        status: 'done',
        priority: 'medium',
        progress: 100,
        deadline: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Gửi Email thông báo tự động',
        description: 'Tích hợp Nodemailer gửi email xác nhận tài khoản.',
        status: 'done',
        priority: 'low',
        progress: 100,
        deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ];

    // Map over tasks to add project, assignedTo, createdBy
    const richTasks = tasksData.map(t => ({
      ...t,
      project: project._id,
      assignedTo: admin._id,
      createdBy: admin._id,
    }));

    // Để bảng có nhiều dữ liệu cho đẹp, mình có thể giữ nguyên các task cũ hoặc xoá hết tuỳ ý.
    // Xoá một số task "rác" không cần thiết để bảng trông chuyên nghiệp, hoặc xóa hết task của admin
    // để nhồi mớ xịn này vào.
    
    // Xóa tất cả task hiện có của Admin (để reset bảng đẹp nhất)
    await Task.deleteMany({ assignedTo: admin._id });
    console.log('Cleared old tasks for admin');

    await Task.insertMany(richTasks);
    console.log(`Inserted ${richTasks.length} highly realistic tasks successfully!`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding tasks:', err);
    process.exit(1);
  }
};

seedAllRealTasks();
