const ApiResponse = require('../utils/apiResponse');

/**
 * Middleware phân quyền dựa trên vai trò (Role-based authorization)
 * @param {...string} roles - Danh sách các vai trò được phép truy cập
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Yêu cầu xác thực đăng nhập trước khi thao tác');
    }

    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(
        res,
        `Từ chối truy cập. Chức năng này yêu cầu vai trò: ${roles.join(', ')}`
      );
    }

    next();
  };
};

/**
 * Kiểm tra quyền Admin
 */
const isAdmin = authorize('admin');

/**
 * Kiểm tra quyền Admin hoặc Quản lý dự án (Project Manager)
 */
const isAdminOrPM = authorize('admin', 'project_manager');

module.exports = { authorize, isAdmin, isAdminOrPM };
