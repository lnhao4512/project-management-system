const User = require('../users/user.model');
const AppError = require('../../utils/appError');
const { generateAccessToken } = require('../../utils/helpers');
const emailService = require('../../utils/email.service');
const crypto = require('crypto');
const logService = require('../logs/log.service');

class AuthService {
  /**
   * Đăng nhập hệ thống
   */
  async login(email, password) {
    const normalizedEmail = email?.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      throw new AppError('Email hoặc mật khẩu không chính xác', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Email hoặc mật khẩu không chính xác', 401);
    }

    if (!user.isActive) {
      throw new AppError('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Admin.', 403);
    }

    // Cập nhật thời gian đăng nhập cuối cùng
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateAccessToken(user._id, user.role);

    const userObj = user.toObject();
    delete userObj.password;

    // Log the login activity
    await logService.createLog({
      action: 'login',
      performedBy: user._id,
      targetType: 'User',
      targetId: user._id,
      targetName: user.name,
      description: 'Người dùng đã đăng nhập vào hệ thống',
    });

    return { user: userObj, token };
  }

  /**
   * Lấy thông tin cá nhân hiện tại
   */
  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }
    return user;
  }

  /**
   * Thay đổi mật khẩu
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Mật khẩu hiện tại không chính xác', 400);
    }

    if (currentPassword === newPassword) {
      throw new AppError('Mật khẩu mới không được trùng với mật khẩu cũ', 400);
    }

    user.password = newPassword;
    await user.save();
    return true;
  }

  /**
   * Quên mật khẩu - Gửi mã OTP 6 số
   */
  async forgotPassword(email) {
    const normalizedEmail = email?.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw new AppError('Email không tồn tại trong hệ thống', 404);
    }

    // Tạo mã OTP 6 số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordToken = otp;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 phút
    await user.save({ validateBeforeSave: false });

    // Gửi OTP qua email
    await emailService.sendOTP(user.email, otp);

    return true;
  }

  /**
   * Xác minh OTP
   */
  async verifyOTP(email, otp) {
    const normalizedEmail = email?.trim().toLowerCase();
    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordToken: otp?.trim(),
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError('Mã OTP không hợp lệ hoặc đã hết hạn', 400);
    }

    return true;
  }

  /**
   * Đặt lại mật khẩu bằng OTP
   */
  async resetPassword(email, otp, newPassword) {
    const normalizedEmail = email?.trim().toLowerCase();
    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordToken: otp?.trim(),
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      throw new AppError('Mã OTP không hợp lệ hoặc đã hết hạn', 400);
    }

    const isMatch = await user.comparePassword(newPassword);
    if (isMatch) {
      throw new AppError('Mật khẩu mới không được trùng với mật khẩu cũ', 400);
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return true;
  }

}

module.exports = new AuthService();
