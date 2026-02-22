const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema(
    {
        // ── Original dimensions ──────────────────────────────────────────────
        complexity: { type: Number, default: 0 },
        architectureScore: { type: Number, default: 0 },
        scalabilityScore: { type: Number, default: 0 },
        codeQualityScore: { type: Number, default: 0 },
        // ── Phase 1: New dimensions ──────────────────────────────────────────
        innovationScore: { type: Number, default: 0 },
        realWorldImpactScore: { type: Number, default: 0 },
        // ── Tags & feedback ─────────────────────────────────────────────────
        skillTags: { type: [String], default: [] },
        strengths: { type: [String], default: [] },
        weaknesses: { type: [String], default: [] },
        improvements: { type: [String], default: [] },
        // ── Career tools ────────────────────────────────────────────────────
        resumeBullets: { type: [String], default: [] },
        nextLearningPath: { type: [String], default: [] },
        // ── Phase 2: Company-fit scores ──────────────────────────────────────
        companyFit: {
            google: { type: Number, default: 0 },
            startup: { type: Number, default: 0 },
            mnc: { type: Number, default: 0 },
        },
    },
    { _id: false }
);

const projectSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        githubUrl: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            minlength: 20,
        },
        techStack: {
            type: [String],
            default: [],
        },
        evaluation: {
            type: evaluationSchema,
            default: null,
        },
        finalScore: {
            type: Number,
            default: null,
        },
        status: {
            type: String,
            enum: ["pending", "evaluated", "failed"],
            default: "pending",
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
        certificationId: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
