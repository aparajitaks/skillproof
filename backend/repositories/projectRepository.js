const Project = require('../models/Project');
const BaseRepository = require('./baseRepository');

/**
 * Project Repository
 * Specific data operations for the Project model
 */
class ProjectRepository extends BaseRepository {
    constructor() {
        super(Project);
    }

    async findByUserId(userId) {
        return await this.model.find({ user: userId });
    }

    async findPublicProjects() {
        return await this.model.find({ visibility: 'public' }).populate('user', 'name publicProfileSlug');
    }
}

module.exports = new ProjectRepository();
