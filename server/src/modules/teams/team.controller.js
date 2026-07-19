const teamService = require('./team.service');
const ApiResponse = require('../../utils/apiResponse');

class TeamController {
  async getAllTeams(req, res, next) {
    try {
      const teams = await teamService.getAllTeams();
      return ApiResponse.success(res, teams);
    } catch (error) {
      next(error);
    }
  }

  async getTeamById(req, res, next) {
    try {
      const team = await teamService.getTeamById(req.params.id);
      return ApiResponse.success(res, team);
    } catch (error) {
      next(error);
    }
  }

  async createTeam(req, res, next) {
    try {
      const team = await teamService.createTeam(req.body);
      return ApiResponse.created(res, team, 'Tạo nhóm thành công');
    } catch (error) {
      next(error);
    }
  }

  async updateTeam(req, res, next) {
    try {
      const team = await teamService.updateTeam(req.params.id, req.body);
      return ApiResponse.success(res, team, 'Cập nhật nhóm thành công');
    } catch (error) {
      next(error);
    }
  }

  async deleteTeam(req, res, next) {
    try {
      await teamService.deleteTeam(req.params.id);
      return ApiResponse.success(res, null, 'Xóa nhóm thành công');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TeamController();
