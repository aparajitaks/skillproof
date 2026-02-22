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
    // ── Profile ──────────────────────────────────────────────────────────
    publicProfileSlug: { type: String, unique: true, sparse: true },
    publicProfileEnabled: { type: Boolean, default: true },
    githubUsername: { type: String, default: null },
    bio: { type: String, maxlength: 300, default: "" },
    avatarUrl: { type: String, default: null },
    // ── Plan & Usage ─────────────────────────────────────────────────────
    plan: { type: String, enum: ["free", "pro", "team"], default: "free" },
    evaluationsUsed: { type: Number, default: 0 },
    evaluationsLimit: { type: Number, default: 3 }, // -1 = unlimited
    // ── Gamification ─────────────────────────────────────────────────────
    achievements: { type: [achievementSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);