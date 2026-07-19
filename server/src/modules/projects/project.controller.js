const projectService = require('./project.service');
const ApiResponse = require('../../utils/apiResponse');

class ProjectController {
  async getAllProjects(req, res, next) {
    try {
      const result = await projectService.getAllProjects(req.query, req.user);
      return ApiResponse.paginated(res, result.projects, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getProjectById(req, res, next) {
    try {
      const project = await projectService.getProjectById(req.params.id, req.user);
      return ApiResponse.success(res, project);
    } catch (error) {
      next(error);
    }
  }

  async createProject(req, res, next) {
    try {
      const project = await projectService.createProject(req.body, req.user);
      return ApiResponse.created(res, project, 'Project created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req, res, next) {
    try {
      const project = await projectService.updateProject(req.params.id, req.body, req.user);
      return ApiResponse.success(res, project, 'Project updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req, res, next) {
    try {
      await projectService.deleteProject(req.params.id, req.user);
      return ApiResponse.success(res, null, 'Project deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async addMember(req, res, next) {
    try {
      const { userId, role } = req.body;
      const project = await projectService.addMember(req.params.id, userId, role, req.user);
      return ApiResponse.success(res, project, 'Member added successfully');
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req, res, next) {
    try {
      const project = await projectService.removeMember(req.params.id, req.params.userId, req.user);
      return ApiResponse.success(res, project, 'Member removed successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProjectController();
