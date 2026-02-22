const User = require("../models/User");
const Project = require("../models/Project");
const asyncHandler = require("../utils/asyncHandler");
const responseHandler = require("../utils/responseHandler");
const logger = require("../utils/logger");

// Groq Llama 3.3 pricing (per 1k tokens)
const COST_PER_1K_TOKENS = 0.00059;

const estimateCost = (tokens) => ((tokens / 1000) * COST_PER_1K_TOKENS).toFixed(4);

// ── GET /api/admin/stats ───────────────────────────────────────────────────────
exports.getStats = asyncHandler(async (req, res) => {
    const [
        totalUsers,
        totalProjects,
        evaluatedCount,
        avgScoreResult,
        tokenUsageResult,
        statusBreakdown,
        techStackResult,
    ] = await Promise.all([
        User.countDocuments(),
        Project.countDocuments(),
        Project.countDocuments({ status: "evaluated" }),
        Project.aggregate([
            { $match: { status: "evaluated", finalScore: { $ne: null } } },
            { $group: { _id: null, avg: { $avg: "$finalScore" } } },
        ]),
        User.aggregate([
            { $group: { _id: null, totalTokens: { $sum: "$aiTokensUsed" } } },
        ]),
        Project.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Project.aggregate([
            { $unwind: "$techStack" },
            { $group: { _id: "$techStack", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]),
    ]);

    const totalTokens = tokenUsageResult[0]?.totalTokens || 0;
    const avgScore = avgScoreResult[0]?.avg ? Math.round(avgScoreResult[0].avg * 10) / 10 : 0;

    const statusMap = Object.fromEntries(statusBreakdown.map((s) => [s._id, s.count]));

    return responseHandler.success(res, {
        stats: {
            totalUsers,
            totalProjects,
            evaluatedProjects: evaluatedCount,
            failedProjects: statusMap.failed || 0,
            processingProjects: statusMap.processing || 0,
            pendingProjects: statusMap.pending || 0,
            avgPlatformScore: avgScore,
            totalTokensUsed: totalTokens,
            estimatedCostUsd: estimateCost(totalTokens),
            topTechStacks: techStackResult.map((t) => ({ name: t._id, count: t.count })),
        }
    });
});

// ── GET /api/admin/users ───────────────────────────────────────────────────────
exports.getUsers = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const sortField = req.query.sortBy || "createdAt";
    const sortDir = req.query.order === "asc" ? 1 : -1;

    const allowedSorts = ["createdAt", "aiTokensUsed", "name", "role"];
    const safeSort = allowedSorts.includes(sortField) ? sortField : "createdAt";

    const [users, total] = await Promise.all([
        User.find()
            .select("name email role aiTokensUsed createdAt publicProfileSlug")
            .sort({ [safeSort]: sortDir })
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(),
    ]);

    // Attach project count per user
    const userIds = users.map((u) => u._id);
    const projectCounts = await Project.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: "$user", count: { $sum: 1 }, topScore: { $max: "$finalScore" } } },
    ]);
    const countMap = Object.fromEntries(projectCounts.map((p) => [p._id.toString(), p]));

    const enriched = users.map((u) => ({
        ...u,
        projectCount: countMap[u._id.toString()]?.count || 0,
        topScore: countMap[u._id.toString()]?.topScore || null,
        estimatedCostUsd: estimateCost(u.aiTokensUsed || 0),
    }));

    return responseHandler.success(res, {
        users: enriched,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});

// ── GET /api/admin/projects ────────────────────────────────────────────────────
exports.getProjects = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status;

    const filter = statusFilter ? { status: statusFilter } : {};

    const [projects, total] = await Promise.all([
        Project.find(filter)
            .select("title status finalScore techStack evaluation.skillTags evaluation.githubAnalyzed evaluation.promptVersion createdAt user")
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Project.countDocuments(filter),
    ]);

    return responseHandler.success(res, {
        projects,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});

// ── GET /api/admin/token-usage ─────────────────────────────────────────────────
exports.getTokenUsage = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        User.find({ aiTokensUsed: { $gt: 0 } })
            .select("name email aiTokensUsed createdAt")
            .sort({ aiTokensUsed: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments({ aiTokensUsed: { $gt: 0 } }),
    ]);

    const enriched = users.map((u) => ({
        ...u,
        estimatedCostUsd: estimateCost(u.aiTokensUsed),
    }));

    return responseHandler.success(res, {
        users: enriched,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});
