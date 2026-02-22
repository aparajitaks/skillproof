const mongoose = require("mongoose");

/**
 * Certificate model — stores metadata + integrity signature for each
 * issued SkillProof certificate. Decoupled from the Project model so
 * certs can be queried, counted, and verified independently.
 */
const certificateSchema = new mongoose.Schema(
    {
        // ── Identity ───────────────────────────────────────────────────────────
        certificationId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        }, // e.g. "SP-A1B2C3D4"

        // ── Relations ─────────────────────────────────────────────────────────
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // ── Integrity ─────────────────────────────────────────────────────────
        // HMAC-SHA256 of `${certificationId}:${projectId}:${userId}`
        // Signed with CERT_SECRET env var. Used by /verify route.
        signature: { type: String, required: true },

        // ── Snapshot at issuance ──────────────────────────────────────────────
        // Denormalise key fields so the public cert page works even if
        // the project is later deleted or made private.
        projectTitle: { type: String, required: true },
        developerName: { type: String, required: true },
        finalScore: { type: Number, required: true },
        techStack: { type: [String], default: [] },
        skillTags: { type: [String], default: [] },
        companyFit: {
            google: { type: Number, default: 0 },
            startup: { type: Number, default: 0 },
            mnc: { type: Number, default: 0 },
        },

        // ── Delivery ──────────────────────────────────────────────────────────
        pdfUrl: { type: String, default: null }, // null → generate on-demand

        // ── Analytics ─────────────────────────────────────────────────────────
        viewCount: { type: Number, default: 0 },
        linkedInShared: { type: Boolean, default: false },
        twitterShared: { type: Boolean, default: false },
        issuedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Certificate", certificateSchema);
