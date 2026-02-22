const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const User = require("../models/User");

/**
 * GET /api/leaderboard
 * Public — no auth required.
 * Returns top 20 developers ranked by their best project score.
 */
router.get("/", async (req, res, next) => {
    try {
        // Aggregate: for each user, find their best score, avg score, and project count
        const entries = await Project.aggregate([
            { $match: { status: "evaluated", finalScore: { $gt: 0 } } },
            {
                $group: {
                    _id: "$user",
                    topScore: { $max: "$finalScore" },
                    avgScore: { $avg: "$finalScore" },
                    projectCount: { $sum: 1 },
                    skillTags: { $push: "$evaluation.skillTags" },
                    topProjectTitle: { $first: "$title" },
                },
            },
            { $sort: { topScore: -1, avgScore: -1 } },
            { $limit: 20 },
        ]);

        // Hydrate user names from the user collection
        const userIds = entries.map((e) => e._id);
        const users = await User.find({ _id: { $in: userIds } })
            .select("name publicProfileSlug avatarUrl");

        const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

        const leaderboard = entries.map((entry, idx) => {
            const user = userMap[entry._id.toString()];
            // Flatten + deduplicate skill tags
            const tags = [...new Set(entry.skillTags.flat())].slice(0, 5);
            return {
                rank: idx + 1,
                userId: entry._id,
                name: user?.name ?? "Anonymous",
                slug: user?.publicProfileSlug ?? null,
                topScore: Math.round(entry.topScore),
                avgScore: Math.round(entry.avgScore * 10) / 10,
                projectCount: entry.projectCount,
                topSkillTags: tags,
                topProjectTitle: entry.topProjectTitle,
            };
        });

        res.json({ leaderboard });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
