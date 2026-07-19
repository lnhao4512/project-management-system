const ApiResponse = require('../utils/apiResponse');

/**
 * Middleware xử lý lỗi toàn cục (Global error handling)
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi máy chủ nội bộ';

  // Lỗi Mongoose CastError (Sai định dạng ID của MongoDB)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Dữ liệu không hợp lệ tại ${err.path}: ${err.value}`;
  }

  // Lỗi Mongoose trùng lặp dữ liệu (Ví dụ: Trùng email)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} đã tồn tại trong hệ thống`;
  }

  // Lỗi Mongoose khi kiểm tra dữ liệu đầu vào (Validation)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiResponse.error(res, 'Kiểm tra dữ liệu đầu vào thất bại', 400, errors);
  }

  // Lỗi liên quan đến Token (JWT)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Mã Token không hợp lệ';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Mã Token đã hết hạn';
  }

  // Lỗi liên quan đến chính sách chia sẻ tài nguyên (CORS)
  if (err.message === 'Not allowed by CORS') {
    statusCode = 403;
    message = 'Yêu cầu bị chặn bởi chính sách bảo mật CORS';
  }

  // In ra lỗi trong môi trường code (Development) để dễ fix bug
  if (process.env.NODE_ENV === 'development') {
    console.error('Lỗi hệ thống:', err);
  }

  return ApiResponse.error(res, message, statusCode);
};

/**
 * Middleware xử lý khi người dùng gọi sai đường dẫn API (Lỗi 404)
 */
const notFoundHandler = (req, res) => {
  return ApiResponse.notFound(res, `Không tìm thấy đường dẫn API: ${req.originalUrl}`);
};

module.exports = { errorHandler, notFoundHandler };
