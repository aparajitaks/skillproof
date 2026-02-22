const { validationResult } = require("express-validator");
const Project = require("../models/Project");
const User = require("../models/User");
const { evaluateProject } = require("../services/aiService");
const { calculateFinalScore } = require("../utils/scoreCalculator");
const logger = require("../utils/logger");

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;

// ── POST /api/projects ────────────────────────────────────────────────────────
exports.createProject = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { title, githubUrl, description, techStack } = req.body;

        // Save project immediately with 'processing' status
        const project = await Project.create({
            user: req.user._id,
            title,
            githubUrl,
            description,
            techStack: Array.isArray(techStack) ? techStack : [],
            status: "processing",
        });

        logger.info(`[projectController] Project created (processing): ${project._id}`);

        // Run AI evaluation — always returns a value, never throws
        const evaluation = await evaluateProject({ title, description, techStack, githubUrl });

        // Calculate deterministic final score — server-owned, not AI-determined
        const finalScore = calculateFinalScore(evaluation);
        const status = finalScore > 0 ? "evaluated" : "failed";

        logger.info(`[projectController] finalScore=${finalScore} → status="${status}"`);

        // Persist evaluation with full AI metadata
        project.evaluation = {
            ...evaluation,
            aiModelVersion: evaluation.aiModelVersion || null,
            promptVersion: evaluation.promptVersion || null,
            tokenUsage: evaluation.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            confidenceScore: evaluation.confidenceScore || null,
            evaluatedAt: new Date(),
            fallback: evaluation.fallback || false,
        };
        project.finalScore = finalScore;
        project.status = status;
        await project.save();

        // Track AI token usage on user account
        if (evaluation.tokenUsage?.totalTokens) {
            await User.findByIdAndUpdate(req.user._id, {
                $inc: {
                    aiTokensUsed: evaluation.tokenUsage.totalTokens,
                },
            });
        }

        // Return structured 422 when evaluation fell back to zeros
        if (status === "failed") {
            logger.warn(`[projectController] ⚠️  Evaluation failed for project: ${project._id}`);
            return res.status(422).json({
                success: false,
                message: "AI evaluation failed. Your project was saved — please resubmit to try again.",
                project: {
                    _id: project._id,
                    title: project.title,
                    status: project.status,
                    createdAt: project.createdAt,
                },
                ...(process.env.NODE_ENV === "development" && {
                    debug: { evaluation, finalScore },
                }),
            });
        }

        res.status(201).json({ success: true, project });

    } catch (error) {
        logger.error(`[projectController] Unexpected error: ${error.message}`);
        next(error);
    }
};

// ── GET /api/projects ─────────────────────────────────────────────────────────
exports.getMyProjects = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(20, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;

        const [projects, total] = await Promise.all([
            Project.find({ user: req.user._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("-__v"),
            Project.countDocuments({ user: req.user._id }),
        ]);

        res.json({
            success: true,
            projects,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
};

// ── GET /api/projects/:id ─────────────────────────────────────────────────────
exports.getProjectById = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id).select("-__v");

        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        if (project.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        res.json({ success: true, project });
    } catch (error) {
        next(error);
    }
};
