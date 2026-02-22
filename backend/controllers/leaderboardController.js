const Project = require("../models/Project");
const User = require("../models/User");
const logger = require("../utils/logger");

/**
 * GET /api/leaderboard
 *
 * Aggregates top developers by their best project finalScore.
 * Supports pagination via ?page=1&limit=20
 * Scores are on a 0–9 scale.
 */
exports.getLeaderboard = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);
        const skip = (page - 1) * limit;

        // Total unique developers on the board (for pagination)
        const totalResult = await Project.aggregate([
            { $match: { status: "evaluated", finalScore: { $gt: 0 } } },
            { $group: { _id: "$user" } },
            { $count: "total" },
        ]);
        const total = totalResult[0]?.total || 0;

        // Aggregate: per user — best score, avg score, project count, skill tags
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
                    lastEvaluatedAt: { $max: "$updatedAt" },
                },
            },
            { $sort: { topScore: -1, avgScore: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);

        // Hydrate user details
        const userIds = entries.map((e) => e._id);
        const users = await User.find({ _id: { $in: userIds } })
            .select("name publicProfileSlug avatarUrl");

        const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

        const leaderboard = entries.map((entry, idx) => {
            const user = userMap[entry._id.toString()];
            const tags = [...new Set(entry.skillTags.flat())].slice(0, 5);
            return {
                rank: skip + idx + 1,
                userId: entry._id,
                name: user?.name ?? "Anonymous",
                slug: user?.publicProfileSlug ?? null,
                topScore: Math.round(entry.topScore),        // 0–100
                avgScore: Math.round(entry.avgScore),         // 0–100
                projectCount: entry.projectCount,
                topSkillTags: tags,
                topProjectTitle: entry.topProjectTitle,
                lastEvaluatedAt: entry.lastEvaluatedAt,
            };
        });

        res.json({
            success: true,
            leaderboard,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error(`[leaderboardController] Error: ${error.message}`);
        next(error);
    }
};
