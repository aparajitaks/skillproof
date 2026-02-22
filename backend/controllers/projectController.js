const { validationResult } = require("express-validator");
const Project = require("../models/Project");
const User = require("../models/User");
const { evaluateProject } = require("../services/aiService");
const { calculateFinalScore } = require("../utils/scoreCalculator");
const { v4: uuidv4 } = require("uuid");

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;

// ── POST /api/projects ────────────────────────────────────────────────────────
exports.createProject = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // ── Phase 3: Evaluation limit gate ───────────────────────────────────
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const limitReached =
            user.evaluationsLimit !== -1 &&
            user.evaluationsUsed >= user.evaluationsLimit;

        if (limitReached) {
            return res.status(403).json({
                success: false,
                code: "EVAL_LIMIT_REACHED",
                message: `You have used all ${user.evaluationsLimit} evaluations on the Free plan.`,
                evaluationsUsed: user.evaluationsUsed,
                evaluationsLimit: user.evaluationsLimit,
                plan: user.plan,
            });
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
            await User.findByIdAndUpdate(req.user._id, { $inc: { evaluationsUsed: 1 } });
        }

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

// ── POST /api/projects/:id/certify ────────────────────────────────────────────
exports.certifyProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ message: "Project not found" });
        if (project.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }
        if (project.status !== "evaluated") {
            return res.status(400).json({ message: "Only evaluated projects can be certified." });
        }

        // Idempotent: if already certified, return existing ID
        if (project.certificationId) {
            return res.json({ certificationId: project.certificationId });
        }

        project.certificationId = `SP-${uuidv4().slice(0, 8).toUpperCase()}`;
        await project.save();

        res.json({ certificationId: project.certificationId });
    } catch (error) {
        next(error);
    }
};

// ── GET /api/cert/:certId (public) ────────────────────────────────────────────
exports.getPublicCert = async (req, res, next) => {
    try {
        const project = await Project.findOne({ certificationId: req.params.certId })
            .select("title finalScore evaluation techStack certificationId createdAt user status");

        if (!project) return res.status(404).json({ message: "Certificate not found" });

        const user = await User.findById(project.user).select("name publicProfileSlug");

        res.json({
            certificationId: project.certificationId,
            developerName: user?.name ?? "Anonymous Developer",
            publicProfileSlug: user?.publicProfileSlug ?? null,
            projectTitle: project.title,
            finalScore: project.finalScore,
            techStack: project.techStack,
            skillTags: project.evaluation?.skillTags ?? [],
            companyFit: project.evaluation?.companyFit ?? null,
            issuedAt: project.createdAt,
        });
    } catch (error) {
        next(error);
    }
};
