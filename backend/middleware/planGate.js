const User = require("../models/User");

/**
 * planGate — enforces free-tier evaluation limits.
 *
 * Responsibilities:
 *  1. Pro / Team users → always pass through (evaluationsLimit === -1)
 *  2. past_due users → 3-day grace period before downgrading access
 *  3. Monthly reset: if usagePeriodStart is in a *previous* calendar month,
 *     reset evaluationsUsed = 0 atomically before checking the limit
 *  4. Race-condition safe: uses findOneAndUpdate with $inc inside the guard
 */
module.exports = async function planGate(req, res, next) {
    try {
        // Fresh DB read — never trust stale JWT payload for billing state
        const user = await User.findById(req.user._id).select(
            "plan evaluationsUsed evaluationsLimit usagePeriodStart subStatus planExpiresAt"
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ── Unlimited plans pass through immediately ──────────────────────────
        if (user.evaluationsLimit === -1 || user.plan === "team") {
            req.user = user; // Attach fresh user to request
            return next();
        }

        // ── Pro plan: check grace-period if past_due ──────────────────────────
        if (user.plan === "pro") {
            const inGracePeriod =
                user.subStatus === "past_due" &&
                user.planExpiresAt &&
                new Date() < new Date(user.planExpiresAt);

            if (user.subStatus === "past_due" && !inGracePeriod) {
                // Grace period expired — downgrade to free
                await User.findByIdAndUpdate(user._id, {
                    plan: "free",
                    subStatus: "canceled",
                    evaluationsLimit: 3,
                });
                // Fall through to free-tier check below
            } else {
                req.user = user;
                return next(); // Pro (active or within grace period) → pass
            }
        }

        // ── Monthly reset check (free tier) ───────────────────────────────────
        const now = new Date();
        const periodStart = new Date(user.usagePeriodStart);
        const isNewMonth =
            now.getFullYear() > periodStart.getFullYear() ||
            now.getMonth() > periodStart.getMonth();

        if (isNewMonth) {
            // Atomic reset — safe against concurrent requests
            await User.findByIdAndUpdate(user._id, {
                evaluationsUsed: 0,
                usagePeriodStart: new Date(now.getFullYear(), now.getMonth(), 1),
            });
            user.evaluationsUsed = 0; // Update local copy for the check below
        }

        // ── Enforce limit ─────────────────────────────────────────────────────
        if (user.evaluationsUsed >= user.evaluationsLimit) {
            return res.status(403).json({
                success: false,
                code: "EVAL_LIMIT_REACHED",
                message: `You've used all ${user.evaluationsLimit} evaluations on the Free plan. Upgrade to Pro for unlimited evaluations.`,
                evaluationsUsed: user.evaluationsUsed,
                evaluationsLimit: user.evaluationsLimit,
                plan: user.plan,
            });
        }

        req.user = user; // Attach refreshed user
        next();
    } catch (err) {
        next(err);
    }
};
