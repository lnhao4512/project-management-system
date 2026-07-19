const User = require('./user.model');

class UserRepository {
  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 10, sort = '-createdAt', select = '' } = options;
    return User.find(filter).sort(sort).skip(skip).limit(limit).select(select);
  }

  async count(filter = {}) {
    return User.countDocuments(filter);
  }

  async findById(id, select = '') {
    return User.findById(id).select(select);
  }

  async findByEmail(email, includePassword = false) {
    const query = User.findOne({ email });
    if (includePassword) query.select('+password');
    return query;
  }

  async create(data) {
    return User.create(data);
  }

  async updateById(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async softDelete(id) {
    return User.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  }

  async search(query, options = {}) {
    const searchFilter = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { department: { $regex: query, $options: 'i' } },
      ],
    };
    return this.findAll(searchFilter, options);
  }
}

module.exports = new UserRepository();
