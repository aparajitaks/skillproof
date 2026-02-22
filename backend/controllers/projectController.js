const { validationResult } = require("express-validator");
const Project = require("../models/Project");
const { runProjectEvaluation, formatEvaluationResult } = require("../services/projectService");
const logger = require("../utils/logger");

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

        const { evaluation, finalScore, status } = await runProjectEvaluation(project);

        logger.info(`[projectController] finalScore=${finalScore} → status="${status}"`);

        await formatEvaluationResult(project, evaluation, finalScore, status, req.user._id);
        await project.save();

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
        logger.error(`[projectController] createProject error: ${error.message}`);
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
                .select("-__v -evaluationHistory"),
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

// ── POST /api/projects/:id/reevaluate ─────────────────────────────────────────
exports.reevaluateProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        // Ownership check
        if (project.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        // Guard: prevent concurrent re-evaluations
        if (project.status === "processing") {
            return res.status(409).json({
                success: false,
                message: "Evaluation already in progress. Please wait before re-evaluating.",
            });
        }

        const previousScore = project.finalScore;
        const previousVersion = project.evaluationVersion || 1;

        // Archive current evaluation into history (cap at 10 entries)
        if (project.evaluation) {
            project.evaluationHistory = [
                {
                    version: previousVersion,
                    finalScore: previousScore,
                    evaluation: project.evaluation,
                    archivedAt: new Date(),
                },
                ...(project.evaluationHistory || []),
            ].slice(0, 10);
        }

        // Mark as processing
        project.status = "processing";
        await project.save();

        logger.info(`[projectController] Re-evaluation started: ${project._id} (v${previousVersion} → v${previousVersion + 1})`);

        const { evaluation, finalScore, status } = await runProjectEvaluation(project);

        await formatEvaluationResult(project, evaluation, finalScore, status, req.user._id);
        project.evaluationVersion = previousVersion + 1;
        await project.save();

        const scoreDelta = finalScore - (previousScore || 0);

        logger.info(`[projectController] Re-evaluation done: ${project._id} | ${previousScore} → ${finalScore} (Δ${scoreDelta > 0 ? "+" : ""}${scoreDelta})`);

        res.json({
            success: true,
            project,
            scoreDelta,
            previousScore,
        });

    } catch (error) {
        logger.error(`[projectController] reevaluate error: ${error.message}`);
        next(error);
    }
};
