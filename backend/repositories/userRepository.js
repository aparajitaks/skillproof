const User = require('../models/User');
const BaseRepository = require('./baseRepository');

/**
 * User Repository
 * Specific data operations for the User model
 */
class UserRepository extends BaseRepository {
    constructor() {
        super(User);
    }

    async findByEmail(email) {
        return await this.model.findOne({ email });
    }

    async findBySlug(slug) {
        return await this.model.findOne({ publicProfileSlug: slug });
    }
}

module.exports = new UserRepository();
