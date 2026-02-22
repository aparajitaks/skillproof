const { v4: uuidv4 } = require("uuid");
const Project = require("../models/Project");
const User = require("../models/User");
const Certificate = require("../models/Certificate");
const { signCertificate, verifyCertificateSignature } = require("../utils/crypto");
const { generateCertificatePDF } = require("../services/pdfService");
const { sendCertificateEmail } = require("../services/emailService");

// ── POST /api/projects/:id/certify ────────────────────────────────────────────
exports.certifyProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project)
            return res.status(404).json({ message: "Project not found" });
        if (project.user.toString() !== req.user._id.toString())
            return res.status(403).json({ message: "Access denied" });
        if (project.status !== "evaluated")
            return res.status(400).json({ message: "Only evaluated projects can be certified." });

        // ── Idempotent: return existing cert if already issued ────────────────
        if (project.certificationId) {
            const existing = await Certificate.findOne({ certificationId: project.certificationId });
            return res.json({ certificationId: project.certificationId, existing: !!existing });
        }

        const user = await User.findById(project.user).select("name email");
        const certificationId = `SP-${uuidv4().slice(0, 8).toUpperCase()}`;

        const signature = signCertificate(
            certificationId,
            project._id.toString(),
            user._id.toString()
        );

        // ── Create Certificate document ───────────────────────────────────────
        const cert = await Certificate.create({
            certificationId,
            project: project._id,
            user: user._id,
            signature,
            projectTitle: project.title,
            developerName: user.name,
            finalScore: project.finalScore,
            techStack: project.techStack || [],
            skillTags: project.evaluation?.skillTags || [],
            companyFit: project.evaluation?.companyFit || { google: 0, startup: 0, mnc: 0 },
            issuedAt: new Date(),
        });

        // ── Mark project as certified ─────────────────────────────────────────
        project.certificationId = certificationId;
        await project.save();

        // ── Send certificate email (non-blocking) ─────────────────────────────
        sendCertificateEmail(user, cert).catch(() => { }); // fire-and-forget

        res.status(201).json({ certificationId });
    } catch (err) {
        next(err);
    }
};

// ── GET /api/cert/:certId (public JSON metadata) ──────────────────────────────
exports.getPublicCert = async (req, res, next) => {
    try {
        const cert = await Certificate.findOne({ certificationId: req.params.certId });
        if (!cert) return res.status(404).json({ message: "Certificate not found" });

        const user = await User.findById(cert.user).select("publicProfileSlug");

        // Increment view counter (fire-and-forget)
        Certificate.findByIdAndUpdate(cert._id, { $inc: { viewCount: 1 } }).exec();

        res.json({
            certificationId: cert.certificationId,
            developerName: cert.developerName,
            publicProfileSlug: user?.publicProfileSlug ?? null,
            projectTitle: cert.projectTitle,
            finalScore: cert.finalScore,
            techStack: cert.techStack,
            skillTags: cert.skillTags,
            companyFit: cert.companyFit,
            issuedAt: cert.issuedAt,
            viewCount: cert.viewCount,
        });
    } catch (err) {
        next(err);
    }
};

// ── GET /api/cert/:certId/verify (public tamper-check) ────────────────────────
exports.verifyCert = async (req, res, next) => {
    try {
        const cert = await Certificate.findOne({ certificationId: req.params.certId })
            .populate("project", "_id")
            .populate("user", "_id");

        if (!cert) {
            return res.json({ valid: false, reason: "Certificate not found" });
        }

        const isValid = verifyCertificateSignature(
            cert.certificationId,
            cert.project._id.toString(),
            cert.user._id.toString(),
            cert.signature
        );

        res.json({
            valid: isValid,
            certificationId: cert.certificationId,
            issuedTo: cert.developerName,
            projectTitle: cert.projectTitle,
            finalScore: cert.finalScore,
            issuedAt: cert.issuedAt,
        });
    } catch (err) {
        next(err);
    }
};

// ── GET /api/cert/:certId/pdf (stream PDF) ────────────────────────────────────
exports.getCertPDF = async (req, res, next) => {
    try {
        const cert = await Certificate.findOne({ certificationId: req.params.certId });
        if (!cert) return res.status(404).json({ message: "Certificate not found" });

        generateCertificatePDF(cert, res);
    } catch (err) {
        next(err);
    }
};

// ── GET /api/cert/:certId/badge.svg (GitHub README badge) ────────────────────
exports.getCertBadge = async (req, res, next) => {
    try {
        const cert = await Certificate.findOne({ certificationId: req.params.certId });
        if (!cert) return res.status(404).json({ message: "Certificate not found" });

        const score = cert.finalScore;
        const color = score >= 80 ? "6C63FF" : score >= 60 ? "f59e0b" : "ef4444";

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="190" height="20" role="img" aria-label="SkillProof: ${score}/100">
  <title>SkillProof: ${score}/100</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="190" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="100" height="20" fill="#555"/>
    <rect x="100" width="90" height="20" fill="#${color}"/>
    <rect width="190" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110">
    <text x="510" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="900" lengthAdjust="spacing">SkillProof ✓</text>
    <text x="510" y="140" transform="scale(.1)" textLength="900" lengthAdjust="spacing">SkillProof ✓</text>
    <text x="1440" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="800" lengthAdjust="spacing">${score}/100</text>
    <text x="1440" y="140" transform="scale(.1)" textLength="800" lengthAdjust="spacing">${score}/100</text>
  </g>
</svg>`;

        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", "public, max-age=3600");
        res.send(svg);
    } catch (err) {
        next(err);
    }
};
