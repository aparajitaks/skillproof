const mongoose = require("mongoose");

// ── Evaluation sub-schema (re-used for history snapshots) ─────────────────────
const evaluationSchema = new mongoose.Schema(
    {
        // Core dimensions (AI-scored, 0–9)
        complexity: { type: Number, default: 0, min: 0, max: 9 },
        architectureScore: { type: Number, default: 0, min: 0, max: 9 },
        scalabilityScore: { type: Number, default: 0, min: 0, max: 9 },
        codeQualityScore: { type: Number, default: 0, min: 0, max: 9 },
        innovationScore: { type: Number, default: 0, min: 0, max: 9 },
        realWorldImpactScore: { type: Number, default: 0, min: 0, max: 9 },

        // Tags & feedback
        skillTags: { type: [String], default: [] },
        strengths: { type: [String], default: [] },
        weaknesses: { type: [String], default: [] },
        improvements: { type: [String], default: [] },

        // Career tools
        resumeBullets: { type: [String], default: [] },
        nextLearningPath: { type: [String], default: [] },

        // Company-fit scores (0–9)
        companyFit: {
            google: { type: Number, default: 0, min: 0, max: 9 },
            startup: { type: Number, default: 0, min: 0, max: 9 },
            mnc: { type: Number, default: 0, min: 0, max: 9 },
        },

        // AI metadata
        aiModelVersion: { type: String, default: null },
        promptVersion: { type: String, default: null },
        tokenUsage: {
            promptTokens: { type: Number, default: 0 },
            completionTokens: { type: Number, default: 0 },
            totalTokens: { type: Number, default: 0 },
        },
        confidenceScore: { type: Number, default: null }, // 0–100 (AI self-confidence)
        evaluatedAt: { type: Date, default: null },
        fallback: { type: Boolean, default: false },
        githubAnalyzed: { type: Boolean, default: false }, // true = evaluated with real code
    },
    { _id: false }
);

// ── Evaluation history entry ───────────────────────────────────────────────────
const evaluationHistorySchema = new mongoose.Schema(
    {
        version: { type: Number, required: true },
        finalScore: { type: Number, required: true },
        evaluation: { type: evaluationSchema },
        archivedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

// ── Project schema ─────────────────────────────────────────────────────────────
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
        visibility: {
            type: String,
            enum: ["public", "private"],
            default: "public",
        },

        // ── Re-evaluation tracking ─────────────────────────────────────────────
        evaluationVersion: {
            type: Number,
            default: 1,
        },
        evaluationHistory: {
            type: [evaluationHistorySchema],
            default: [],
        },
    },
    { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
projectSchema.index({ user: 1, createdAt: -1 });     // User's project list
projectSchema.index({ finalScore: -1 });              // Leaderboard scoring
projectSchema.index({ status: 1, finalScore: -1 });   // Leaderboard filter
projectSchema.index({ createdAt: -1 });               // Global feed / recency

/**
 * Project Methods for better encapsulation (OOP)
 */
projectSchema.methods.isEvaluated = function() {
    return this.status === 'evaluated';
};

projectSchema.methods.isProcessing = function() {
    return this.status === 'processing';
};

projectSchema.methods.archiveCurrentEvaluation = function() {
    if (this.evaluation && this.finalScore !== null) {
        const version = this.evaluationHistory.length + 1;
        this.evaluationHistory.push({
            version,
            finalScore: this.finalScore,
            evaluation: this.evaluation,
            archivedAt: new Date()
        });
    }
};

module.exports = mongoose.model("Project", projectSchema);
