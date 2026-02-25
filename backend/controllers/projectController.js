const asyncHandler = require("../utils/asyncHandler");
const responseHandler = require("../utils/responseHandler");
const projectRepository = require("../repositories/projectRepository");
const { runProjectEvaluation, formatEvaluationResult } = require("../services/projectService");
const logger = require("../utils/logger");

// ── POST /api/projects ────────────────────────────────────────────────────────
exports.createProject = asyncHandler(async (req, res) => {
    const { title, githubUrl, description, techStack } = req.body;

    // Save project immediately with 'processing' status
    const project = await projectRepository.create({
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
        return responseHandler.error(
            res,
            "AI evaluation failed. Your project was saved — please resubmit to try again.",
            "EVALUATION_FAILED",
            422,
            {
                project: {
                    _id: project._id,
                    title: project.title,
                    status: project.status,
                    createdAt: project.createdAt,
                }
            }
        );
    }

    return responseHandler.success(res, { project }, 201);
});

// ── GET /api/projects ─────────────────────────────────────────────────────────
exports.getMyProjects = asyncHandler(async (req, res) => {
    const projects = await projectRepository.findByUserId(req.user._id);

    return responseHandler.success(res, { projects });
});

// ── GET /api/projects/:id ─────────────────────────────────────────────────────
exports.getProjectById = asyncHandler(async (req, res) => {
    const project = await projectRepository.findById(req.params.id);

    if (!project) {
        return responseHandler.error(res, "Project not found", "NOT_FOUND", 404);
    }

    if (project.user.toString() !== req.user._id.toString()) {
        return responseHandler.error(res, "Access denied", "FORBIDDEN", 403);
    }

    return responseHandler.success(res, { project });
});

// ── POST /api/projects/:id/reevaluate ─────────────────────────────────────────
exports.reevaluateProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
        return responseHandler.error(res, "Project not found", "NOT_FOUND", 404);
    }

    // Ownership check
    if (project.user.toString() !== req.user._id.toString()) {
        return responseHandler.error(res, "Access denied", "FORBIDDEN", 403);
    }

    // Guard: prevent concurrent re-evaluations
    if (project.status === "processing") {
        return responseHandler.error(
            res,
            "Evaluation already in progress. Please wait before re-evaluating.",
            "CONFLICT",
            409
        );
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

    return responseHandler.success(res, {
        project,
        scoreDelta,
        previousScore,
    });
});
