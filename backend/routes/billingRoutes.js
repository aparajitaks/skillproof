const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    createCheckoutSession,
    createPortalSession,
    getBillingStatus,
    handleWebhook,
} = require("../controllers/billingController");

// ── Webhook — raw body, NO auth ───────────────────────────────────────────────
// This route is mounted separately in server.js with express.raw middleware
router.post("/webhook", handleWebhook);

// ── Authenticated billing routes ──────────────────────────────────────────────
router.use(authMiddleware);

router.post("/create-checkout-session", createCheckoutSession);
router.post("/portal", createPortalSession);
router.get("/status", getBillingStatus);

module.exports = router;
