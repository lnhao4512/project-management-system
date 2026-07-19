const userRepository = require('./user.repository');
const AppError = require('../../utils/appError');
const { parsePagination, buildPaginationMeta } = require('../../utils/helpers');
const path = require('path');
const fs = require('fs');
const emailService = require('../../utils/email.service');

const generateRandomPassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specials = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
  
  // Đảm bảo có ít nhất 1 chữ thường, 1 chữ hoa, 1 số, 1 ký tự đặc biệt
  let pass = '';
  pass += chars[Math.floor(Math.random() * chars.length)];
  pass += upperChars[Math.floor(Math.random() * upperChars.length)];
  pass += numbers[Math.floor(Math.random() * numbers.length)];
  pass += specials[Math.floor(Math.random() * specials.length)];
  
  // Điền thêm 6 ký tự ngẫu nhiên nữa (tổng 10 ký tự)
  const allChars = chars + upperChars + numbers + specials;
  for (let i = 0; i < 6; i++) {
    pass += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Trộn chuỗi
  return pass.split('').sort(() => 0.5 - Math.random()).join('');
};

class UserService {
  /**
   * Lấy tất cả người dùng kèm phân trang và bộ lọc
   */
  async getAllUsers(query) {
    const { page, limit, skip } = parsePagination(query);
    const filter = {};

    if (query.role) filter.role = query.role;
    if (query.department) filter.department = new RegExp(query.department, 'i');
    if (query.position) filter.position = new RegExp(query.position, 'i');
    if (query.isActive !== undefined) filter.isActive = query.isActive;

    let users, total;
    if (query.search && query.search.trim()) {
      users = await userRepository.search(query.search, {
        skip,
        limit,
        sort: query.sort || '-createdAt',
      });
      // Số lượng khi tìm kiếm chỉ mang tính tương đối
      total = users.length + skip;
    } else {
      [users, total] = await Promise.all([
        userRepository.findAll(filter, { skip, limit, sort: query.sort || '-createdAt' }),
        userRepository.count(filter),
      ]);
    }

    return {
      users,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Lấy người dùng theo ID
   */
  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    return user;
  }

  /**
   * Tạo người dùng mới (chỉ dành cho Admin)
   */
  async createUser(data) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new AppError('Email này đã được sử dụng', 409);
    
    // Tự động sinh mật khẩu nếu không cung cấp
    let rawPassword = data.password;
    if (!rawPassword) {
      rawPassword = generateRandomPassword();
      data.password = rawPassword;
    }

    const newUser = await userRepository.create(data);
    
    // Gửi email chào mừng với mật khẩu
    try {
      await emailService.sendWelcomeEmail(newUser.email, rawPassword);
    } catch (error) {
      console.error('Không thể gửi email thông báo tài khoản cho user:', newUser.email, error);
    }

    return newUser;
  }

  /**
   * Cập nhật người dùng
   */
  async updateUser(id, data, requestingUser) {
    // Chỉ có Admin mới được phép thay đổi vai trò người dùng
    if (data.role && requestingUser.role !== 'admin') {
      throw new AppError('Chỉ có Admin mới được phép thay đổi vai trò người dùng', 403);
    }

    const user = await userRepository.updateById(id, data);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    return user;
  }

  /**
   * Cập nhật ảnh đại diện
   */
  async updateAvatar(userId, file) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);

    // Xóa ảnh cũ nếu có tồn tại
    if (user.avatar) {
      const oldPath = path.join(__dirname, '../../../uploads', path.basename(user.avatar));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const avatarUrl = `/uploads/${file.filename}`;
    return userRepository.updateById(userId, { avatar: avatarUrl });
  }

  /**
   * Xóa người dùng (Xóa mềm - Ẩn khỏi hệ thống)
   */
  async deleteUser(id) {
    const user = await userRepository.softDelete(id);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    return user;
  }

  /**
   * Cập nhật thông tin cá nhân (Tự đổi)
   */
  async updateProfile(userId, data) {
    // Xóa các trường nhạy cảm không cho phép tự sửa
    const { role, isActive, ...safeData } = data;
    return userRepository.updateById(userId, safeData);
  }
}

module.exports = new UserService();
