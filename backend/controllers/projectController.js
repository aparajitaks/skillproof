const { validationResult } = require("express-validator");
const Project = require("../models/Project");
const User = require("../models/User");
const { evaluateProject } = require("../services/aiService");
const { calculateFinalScore } = require("../utils/scoreCalculator");
const { sendUpgradeNudgeEmail } = require("../services/emailService");

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;

// ── POST /api/projects ────────────────────────────────────────────────────────
// Note: planGate middleware runs before this handler — it enforces usage limits
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

        // Increment evaluationsUsed only on successful evaluation
        if (status === "evaluated") {
            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                { $inc: { evaluationsUsed: 1 } },
                { new: true }
            ).select("evaluationsUsed evaluationsLimit plan email name");

            // Nudge email when hitting 2/3 free evaluations (fire-and-forget)
            if (
                updatedUser &&
                updatedUser.plan === "free" &&
                updatedUser.evaluationsUsed >= updatedUser.evaluationsLimit - 1
            ) {
                sendUpgradeNudgeEmail(updatedUser).catch(() => { });
            }
        }

        // Return structured 422 when evaluation failed
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

        // Return usage info alongside projects so Dashboard can show the meter
        const user = await User.findById(req.user._id).select("evaluationsUsed evaluationsLimit plan");

        res.json({
            projects,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            usage: {
                evaluationsUsed: user?.evaluationsUsed ?? 0,
                evaluationsLimit: user?.evaluationsLimit ?? 3,
                plan: user?.plan ?? "free",
            },
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

// certifyProject, getPublicCert, verifyCert, getCertPDF, getCertBadge
// → moved to certController.js for separation of concerns
