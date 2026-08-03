const authService = require('./auth.service');
const ApiResponse = require('../../utils/apiResponse');
const logService = require('../logs/log.service');

class AuthController {
  /**
   * POST /api/v1/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return ApiResponse.success(res, result, 'Đăng nhập thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user._id);
      return ApiResponse.success(res, user, 'Lấy thông tin cá nhân thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req, res, next) {
    try {
      if (req.user) {
        await logService.createLog({
          action: 'logout',
          performedBy: req.user._id,
          targetType: 'User',
          targetId: req.user._id,
          targetName: req.user.name,
          description: 'Người dùng đã đăng xuất khỏi hệ thống',
        });
      }
      return ApiResponse.success(res, null, 'Đăng xuất thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user._id, currentPassword, newPassword);
      return ApiResponse.success(res, null, 'Đổi mật khẩu thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      const message = result.emailSent
        ? 'Mã OTP đã được gửi đến email của bạn'
        : 'Mã OTP đã được tạo thành công';
      return ApiResponse.success(res, result, message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/verify-otp
   */
  async verifyOTP(req, res, next) {
    try {
      const { email, otp } = req.body;
      await authService.verifyOTP(email, otp);
      return ApiResponse.success(res, null, 'Mã OTP hợp lệ');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { email, otp, password } = req.body;
      await authService.resetPassword(email, otp, password);
      return ApiResponse.success(res, null, 'Đặt lại mật khẩu thành công');
    } catch (error) {
      next(error);
    }
  }

}

module.exports = new AuthController();
