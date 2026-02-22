const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema(
    {
        // ── Core dimensions (AI-scored, 1-10) ────────────────────────────────
        complexity: { type: Number, default: 0 },
        architectureScore: { type: Number, default: 0 },
        scalabilityScore: { type: Number, default: 0 },
        codeQualityScore: { type: Number, default: 0 },
        innovationScore: { type: Number, default: 0 },
        realWorldImpactScore: { type: Number, default: 0 },

        // ── Tags & feedback ──────────────────────────────────────────────────
        skillTags: { type: [String], default: [] },
        strengths: { type: [String], default: [] },
        weaknesses: { type: [String], default: [] },
        improvements: { type: [String], default: [] },

        // ── Career tools ─────────────────────────────────────────────────────
        resumeBullets: { type: [String], default: [] },
        nextLearningPath: { type: [String], default: [] },

        // ── Company-fit scores (0–100) ───────────────────────────────────────
        companyFit: {
            google: { type: Number, default: 0 },
            startup: { type: Number, default: 0 },
            mnc: { type: Number, default: 0 },
        },

        // ── AI metadata (interview-discussable) ──────────────────────────────
        aiModelVersion: { type: String, default: null }, // e.g. "llama-3.3-70b-versatile"
        promptVersion: { type: String, default: null }, // e.g. "v2.0"
        tokenUsage: {
            promptTokens: { type: Number, default: 0 },
            completionTokens: { type: Number, default: 0 },
            totalTokens: { type: Number, default: 0 },
        },
        confidenceScore: { type: Number, default: null }, // 0–100
        evaluatedAt: { type: Date, default: null },
        fallback: { type: Boolean, default: false }, // true = AI failed, using fallback
    },
    { _id: false }
);

const projectSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
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
            enum: ["pending", "processing", "evaluated", "failed"],
            default: "pending",
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
projectSchema.index({ user: 1, createdAt: -1 });     // User's project list (sorted)
projectSchema.index({ finalScore: -1 });              // Leaderboard scoring
projectSchema.index({ status: 1, finalScore: -1 });   // Leaderboard filter
projectSchema.index({ createdAt: -1 });               // Global feed / recency

module.exports = mongoose.model("Project", projectSchema);
