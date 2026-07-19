const { verifyAccessToken } = require('../utils/helpers');
const ApiResponse = require('../utils/apiResponse');
const User = require('../modules/users/user.model');

/**
 * Middleware xác thực JWT (Kiểm tra đăng nhập)
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'Yêu cầu cung cấp Access Token để truy cập');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('+isActive');
    if (!user) {
      return ApiResponse.unauthorized(res, 'Không tìm thấy người dùng trong hệ thống');
    }

    if (!user.isActive) {
      return ApiResponse.unauthorized(res, 'Tài khoản của bạn đã bị vô hiệu hóa');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Mã Token đã hết hạn, vui lòng đăng nhập lại');
    }
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Mã Token không hợp lệ');
    }
    next(error);
  }
};

module.exports = { authenticate };
