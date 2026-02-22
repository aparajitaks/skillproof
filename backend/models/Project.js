const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema(
    {
        // ── Core dimensions (AI-scored, 0–9) ──────────────────────────────────
        complexity: { type: Number, default: 0, min: 0, max: 9 },
        architectureScore: { type: Number, default: 0, min: 0, max: 9 },
        scalabilityScore: { type: Number, default: 0, min: 0, max: 9 },
        codeQualityScore: { type: Number, default: 0, min: 0, max: 9 },
        innovationScore: { type: Number, default: 0, min: 0, max: 9 },
        realWorldImpactScore: { type: Number, default: 0, min: 0, max: 9 },

        // ── Tags & feedback ──────────────────────────────────────────────────
        skillTags: { type: [String], default: [] },
        strengths: { type: [String], default: [] },
        weaknesses: { type: [String], default: [] },
        improvements: { type: [String], default: [] },

        // ── Career tools ─────────────────────────────────────────────────────
        resumeBullets: { type: [String], default: [] },
        nextLearningPath: { type: [String], default: [] },

        // ── Company-fit scores (0–9) ──────────────────────────────────────────
        companyFit: {
            google: { type: Number, default: 0, min: 0, max: 9 },
            startup: { type: Number, default: 0, min: 0, max: 9 },
            mnc: { type: Number, default: 0, min: 0, max: 9 },
        },

        // ── AI metadata (interview-discussable) ──────────────────────────────
        aiModelVersion: { type: String, default: null }, // e.g. "llama-3.3-70b-versatile"
        promptVersion: { type: String, default: null }, // e.g. "v3.0"
        tokenUsage: {
            promptTokens: { type: Number, default: 0 },
            completionTokens: { type: Number, default: 0 },
            totalTokens: { type: Number, default: 0 },
        },
        confidenceScore: { type: Number, default: null }, // 0–100 (AI self-confidence, not project score)
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
            min: 0,
            max: 9,
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
