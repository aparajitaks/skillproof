const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    certifyProject,
    getPublicCert,
    verifyCert,
    getCertPDF,
    getCertBadge,
} = require("../controllers/certController");

// ── Public routes (no auth) ───────────────────────────────────────────────────
router.get("/:certId", getPublicCert);   // JSON metadata
router.get("/:certId/verify", verifyCert);      // tamper-proof check
router.get("/:certId/pdf", getCertPDF);      // stream PDF
router.get("/:certId/badge.svg", getCertBadge);  // GitHub README badge

module.exports = router;
