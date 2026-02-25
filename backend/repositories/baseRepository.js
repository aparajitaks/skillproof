/**
 * Base Repository
 * Implements common data access logic for all repositories
 */
class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async findAll(filter = {}) {
        return await this.model.find(filter);
    }

    async findById(id) {
        return await this.model.findById(id);
    }

    async findOne(filter = {}) {
        return await this.model.findOne(filter);
    }

    async create(data) {
        return await this.model.create(data);
    }

    async update(id, data) {
        return await this.model.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id) {
        return await this.model.findByIdAndDelete(id);
    }
}

module.exports = BaseRepository;
