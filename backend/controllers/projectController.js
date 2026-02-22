const { validationResult } = require("express-validator");
const Project = require("../models/Project");
const { evaluateProject } = require("../services/aiService");
const { calculateFinalScore } = require("../utils/scoreCalculator");

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;

// POST /api/projects
exports.createProject = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, githubUrl, description, techStack } = req.body;

        // Save project immediately with 'pending' status
        const project = await Project.create({
            user: req.user._id,
            title,
            githubUrl,
            description,
            techStack: Array.isArray(techStack) ? techStack : [],
            status: "pending",
        });

        console.log("[projectController] Project created (pending):", project._id.toString());

        // Run AI evaluation (safe — always returns a value, never throws)
        const evaluation = await evaluateProject({ title, description, techStack, githubUrl });
        console.log("[projectController] Evaluation result:", JSON.stringify(evaluation, null, 2));

        // Calculate deterministic final score — server-owned, never from AI
        const finalScore = calculateFinalScore(evaluation);
        const status = finalScore > 0 ? "evaluated" : "failed";
        console.log(`[projectController] finalScore=${finalScore} → status="${status}"`);

        // Update project with evaluation results
        project.evaluation = evaluation;
        project.finalScore = finalScore;
        project.status = status;
        await project.save();

        // Return structured 422 when evaluation failed so the frontend can show a clear message
        if (status === "failed") {
            console.warn("[projectController] ⚠️  Returning 422 — evaluation failed for project:", project._id.toString());
            return res.status(422).json({
                success: false,
                message: "AI evaluation failed. Your project was saved — please resubmit to try again.",
                project: {
                    _id: project._id,
                    title: project.title,
                    status: project.status,
                    createdAt: project.createdAt,
                },
                // Only exposed in development so you can see what the AI returned
                ...(process.env.NODE_ENV === "development" && {
                    debug: { evaluation, finalScore },
                }),
            });
        }

        res.status(201).json({ success: true, project });

    } catch (error) {
        console.error("[projectController] ❌ Unexpected error:", error.message);
        next(error);
    }
};

// GET /api/projects
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
            projects,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/projects/:id
exports.getProjectById = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id).select("-__v");

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Ownership check — users may only view their own projects
        if (project.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.json(project);
    } catch (error) {
        next(error);
    }
};
