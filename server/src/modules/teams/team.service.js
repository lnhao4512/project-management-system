const Team = require('./team.model');
const AppError = require('../../utils/appError');

class TeamService {
  async getAllTeams() {
    return Team.find().populate('leader', 'name email avatar').populate('members', 'name email avatar');
  }

  async getTeamById(id) {
    const team = await Team.findById(id).populate('leader', 'name email avatar').populate('members', 'name email avatar');
    if (!team) throw new AppError('Team not found', 404);
    return team;
  }

  async createTeam(data) {
    const existing = await Team.findOne({ name: data.name });
    if (existing) throw new AppError('Tên nhóm đã tồn tại', 400);
    return Team.create(data);
  }

  async updateTeam(id, data) {
    const team = await Team.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('leader', 'name email avatar')
      .populate('members', 'name email avatar');
    if (!team) throw new AppError('Team not found', 404);
    return team;
  }

  async deleteTeam(id) {
    const team = await Team.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!team) throw new AppError('Team not found', 404);
    return team;
  }
}

module.exports = new TeamService();
