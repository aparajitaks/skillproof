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
    githubId: { type: String, default: null },
    githubAccessToken: { type: String, default: null }, // encrypted at rest in P4
    bio: { type: String, maxlength: 300, default: "" },
    avatarUrl: { type: String, default: null },

    // ── Plan & Usage ──────────────────────────────────────────────────────
    plan: { type: String, enum: ["free", "pro", "team"], default: "free" },
    evaluationsUsed: { type: Number, default: 0 },
    evaluationsLimit: { type: Number, default: 3 }, // -1 = unlimited
    usagePeriodStart: { type: Date, default: Date.now }, // first day of current billing month

    // ── Stripe Billing ────────────────────────────────────────────────────
    stripeCustomerId: { type: String, default: null },
    stripeSubId: { type: String, default: null },
    subStatus: {
      type: String,
      enum: ["active", "past_due", "canceled", "trialing", null],
      default: null,
    },
    planExpiresAt: { type: Date, default: null }, // grace period end date

    // ── Referral ──────────────────────────────────────────────────────────
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    referralCredits: { type: Number, default: 0 }, // free eval credits earned

    // ── Email Verification ────────────────────────────────────────────────
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, default: null },

    // ── AI Cost Tracking ──────────────────────────────────────────────────
    aiTokensUsed: { type: Number, default: 0 },
    aiCostUsd: { type: Number, default: 0 },

    // ── Gamification ──────────────────────────────────────────────────────
    achievements: { type: [achievementSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);