const Stripe = require("stripe");
const User = require("../models/User");

// Lazy-initialize Stripe client — safe to import without STRIPE_SECRET_KEY set.
// Will throw a clear error only when a billing route is actually called.
let _stripe = null;
function getStripe() {
    if (!_stripe) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) throw new Error("STRIPE_SECRET_KEY is not set. Configure it in .env");
        _stripe = Stripe(key);
    }
    return _stripe;
}


// ── POST /api/billing/create-checkout-session ─────────────────────────────────
exports.createCheckoutSession = async (req, res, next) => {
    try {
        const { priceId } = req.body;
        if (!priceId) {
            return res.status(400).json({ message: "priceId is required" });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Create Stripe customer if not exists
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await getStripe().customers.create({
                email: user.email,
                name: user.name,
                metadata: { userId: user._id.toString() },
            });
            customerId = customer.id;
            await User.findByIdAndUpdate(user._id, { stripeCustomerId: customerId });
        }

        const session = await getStripe().checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.FRONTEND_URL}/dashboard?upgrade=success`,
            cancel_url: `${process.env.FRONTEND_URL}/pricing?upgrade=canceled`,
            subscription_data: {
                metadata: { userId: user._id.toString() },
            },
            allow_promotion_codes: true,
        });

        res.json({ url: session.url });
    } catch (err) {
        next(err);
    }
};

// ── POST /api/billing/portal ──────────────────────────────────────────────────
exports.createPortalSession = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select("stripeCustomerId");
        if (!user?.stripeCustomerId) {
            return res.status(400).json({ message: "No billing account found. Subscribe first." });
        }

        const session = await getStripe().billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${process.env.FRONTEND_URL}/dashboard`,
        });

        res.json({ url: session.url });
    } catch (err) {
        next(err);
    }
};

// ── GET /api/billing/status ───────────────────────────────────────────────────
exports.getBillingStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select(
            "plan subStatus planExpiresAt evaluationsUsed evaluationsLimit usagePeriodStart stripeSubId"
        );
        if (!user) return res.status(404).json({ message: "User not found" });

        let nextRenewal = null;
        if (user.stripeSubId) {
            try {
                const sub = await getStripe().subscriptions.retrieve(user.stripeSubId);
                nextRenewal = new Date(sub.current_period_end * 1000);
            } catch { /* no-op — Stripe might be unreachable */ }
        }

        res.json({
            plan: user.plan,
            subStatus: user.subStatus,
            planExpiresAt: user.planExpiresAt,
            nextRenewal,
            evaluationsUsed: user.evaluationsUsed,
            evaluationsLimit: user.evaluationsLimit,
            usagePeriodStart: user.usagePeriodStart,
        });
    } catch (err) {
        next(err);
    }
};

// ── POST /api/billing/webhook ─────────────────────────────────────────────────
// IMPORTANT: Must be mounted with express.raw({ type: 'application/json' })
// and BEFORE express.json() in server.js
exports.handleWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = getStripe().webhooks.constructEvent(
            req.body, // raw Buffer
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("[webhook] ❌ Signature validation failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        await handleStripeEvent(event);
        res.json({ received: true });
    } catch (err) {
        console.error("[webhook] ❌ Event processing failed:", err.message);
        res.status(500).json({ error: "Internal webhook processing error" });
    }
};

// ── Internal event dispatcher ─────────────────────────────────────────────────
async function handleStripeEvent(event) {
    const { type, data } = event;
    console.log(`[webhook] Processing: ${type}`);

    switch (type) {
        case "checkout.session.completed": {
            const session = data.object;
            const userId = session.subscription_data?.metadata?.userId || session.metadata?.userId;
            if (!userId) return;

            await User.findByIdAndUpdate(userId, {
                plan: "pro",
                subStatus: "active",
                stripeSubId: session.subscription,
                evaluationsLimit: -1, // unlimited
                planExpiresAt: null,
            });
            console.log(`[webhook] ✅ Upgraded user ${userId} to Pro`);
            break;
        }

        case "customer.subscription.updated": {
            const sub = data.object;
            const userId = sub.metadata?.userId;
            if (!userId) return;

            const status = sub.status; // active | past_due | canceled | trialing
            const updates = { subStatus: status };

            if (status === "past_due") {
                // 3-day grace period
                updates.planExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            } else if (status === "active") {
                updates.planExpiresAt = null;
            }

            await User.findByIdAndUpdate(userId, updates);
            console.log(`[webhook] ↻ Subscription updated for user ${userId}: ${status}`);
            break;
        }

        case "customer.subscription.deleted": {
            const sub = data.object;
            const userId = sub.metadata?.userId;
            if (!userId) return;

            await User.findByIdAndUpdate(userId, {
                plan: "free",
                subStatus: "canceled",
                stripeSubId: null,
                evaluationsLimit: 3,
                planExpiresAt: null,
            });
            console.log(`[webhook] ⬇ Downgraded user ${userId} to Free`);
            break;
        }

        case "invoice.payment_succeeded": {
            const invoice = data.object;
            const customerId = invoice.customer;
            const user = await User.findOne({ stripeCustomerId: customerId });
            if (!user) return;

            // Reset usage on successful monthly payment
            const now = new Date();
            await User.findByIdAndUpdate(user._id, {
                evaluationsUsed: 0,
                usagePeriodStart: new Date(now.getFullYear(), now.getMonth(), 1),
                subStatus: "active",
                planExpiresAt: null,
            });
            console.log(`[webhook] ✅ Usage reset for user ${user._id} after payment`);
            break;
        }

        case "invoice.payment_failed": {
            const invoice = data.object;
            const customerId = invoice.customer;
            const user = await User.findOne({ stripeCustomerId: customerId });
            if (!user) return;

            await User.findByIdAndUpdate(user._id, {
                subStatus: "past_due",
                planExpiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            });
            console.log(`[webhook] ⚠️  Payment failed for user ${user._id} — grace period started`);
            // TODO P5: send payment-failed email here
            break;
        }

        default:
            console.log(`[webhook] Unhandled event type: ${type}`);
    }
}
