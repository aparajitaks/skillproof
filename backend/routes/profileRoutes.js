const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Project = require("../models/Project");

// GET /api/profile/:slug — public, no auth required
router.get("/:slug", async (req, res, next) => {
    try {
        const user = await User.findOne({
            publicProfileSlug: req.params.slug,
            publicProfileEnabled: true,
        }).select("name bio githubUsername avatarUrl publicProfileSlug achievements plan");

        if (!user) {
            return res.status(404).json({ message: "Profile not found or is private." });
        }

        const projects = await Project.find({ user: user._id, status: "evaluated" })
            .select("title githubUrl techStack finalScore evaluation status createdAt")
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({ user, projects });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
