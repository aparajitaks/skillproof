const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Auth Service
 * Business logic for authentication and user management
 */
class AuthService {
    async registerUser(userData) {
        const { name, email, password } = userData;

        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            const error = new Error('Email already registered');
            error.statusCode = 409;
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Auto-generate a unique public profile slug
        const baseSlug = name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
        const suffix = Math.random().toString(16).slice(2, 6);
        const publicProfileSlug = `${baseSlug}-${suffix}`;

        const user = await userRepository.create({
            name,
            email,
            password: hashedPassword,
            publicProfileSlug,
        });

        const token = this.generateToken(user._id);
        return { user, token };
    }

    async loginUser(email, password) {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            throw error;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            throw error;
        }

        const token = this.generateToken(user._id);
        return { user, token };
    }

    generateToken(id) {
        return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    }
}

module.exports = new AuthService();
