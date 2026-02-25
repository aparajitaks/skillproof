const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    icon: String,
    earnedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, default: "developer", enum: ["developer", "recruiter", "admin"] },

    // ── Profile ───────────────────────────────────────────────────────────
    publicProfileSlug: { type: String, unique: true, sparse: true },
    publicProfileEnabled: { type: Boolean, default: true },
    githubUsername: { type: String, default: null },
    bio: { type: String, maxlength: 300, default: "" },
    avatarUrl: { type: String, default: null },

    // ── AI Cost Tracking ──────────────────────────────────────────────────
    aiTokensUsed: { type: Number, default: 0 },
    aiCostUsd: { type: Number, default: 0 },

    // ── Gamification ──────────────────────────────────────────────────────
    achievements: { type: [achievementSchema], default: [] },
  },
  { timestamps: true }
);

// Note: email and publicProfileSlug already have indexes from `unique: true`
// No explicit .index() needed — avoids duplicate index warnings in Mongoose

/**
 * User Methods for better encapsulation (OOP)
 */
userSchema.methods.isDeveloper = function() {
    return this.role === 'developer';
};

userSchema.methods.isRecruiter = function() {
    return this.role === 'recruiter';
};

userSchema.methods.isAdmin = function() {
    return this.role === 'admin';
};

userSchema.methods.updateTokenUsage = function(tokens) {
    this.aiTokensUsed += tokens;
    // Basic cost calculation (e.g., $0.002 per 1k tokens)
    this.aiCostUsd += (tokens / 1000) * 0.002;
    return this.save();
};

module.exports = mongoose.model("User", userSchema);