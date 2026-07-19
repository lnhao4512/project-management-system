/**
 * Tiện ích chuẩn hóa kết quả API trả về
 */
class ApiResponse {
  static success(res, data = null, message = 'Thành công', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static created(res, data = null, message = 'Tạo mới thành công') {
    return this.success(res, data, message, 201);
  }

  static error(res, message = 'Lỗi máy chủ nội bộ', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  }

  static notFound(res, message = 'Không tìm thấy tài nguyên') {
    return this.error(res, message, 404);
  }

  static unauthorized(res, message = 'Không có quyền truy cập (Chưa đăng nhập)') {
    return this.error(res, message, 401);
  }

  static forbidden(res, message = 'Bị từ chối truy cập (Không đủ thẩm quyền)') {
    return this.error(res, message, 403);
  }

  static badRequest(res, message = 'Yêu cầu không hợp lệ', errors = null) {
    return this.error(res, message, 400, errors);
  }

  static paginated(res, data, pagination, message = 'Thành công') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = ApiResponse;
