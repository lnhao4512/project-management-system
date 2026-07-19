const userService = require('./user.service');
const ApiResponse = require('../../utils/apiResponse');

class UserController {
  async getAllUsers(req, res, next) {
    try {
      const result = await userService.getAllUsers(req.query);
      return ApiResponse.paginated(res, result.users, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      return ApiResponse.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      return ApiResponse.created(res, user, 'Tạo người dùng thành công');
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body, req.user);
      return ApiResponse.success(res, user, 'Cập nhật người dùng thành công');
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      await userService.deleteUser(req.params.id);
      return ApiResponse.success(res, null, 'Xóa người dùng thành công');
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await userService.getUserById(req.user._id);
      return ApiResponse.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user._id, req.body);
      return ApiResponse.success(res, user, 'Cập nhật thông tin cá nhân thành công');
    } catch (error) {
      next(error);
    }
  }

  async updateAvatar(req, res, next) {
    try {
      if (!req.file) {
        return ApiResponse.badRequest(res, 'Chưa có file nào được tải lên');
      }
      const user = await userService.updateAvatar(req.user._id, req.file);
      return ApiResponse.success(res, user, 'Cập nhật ảnh đại diện thành công');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
