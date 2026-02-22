const PDFDocument = require("pdfkit");

/**
 * Generates a SkillProof certificate PDF and pipes it to a Node.js Writable stream.
 *
 * @param {Object} cert  - Certificate data
 * @param {string} cert.certificationId
 * @param {string} cert.developerName
 * @param {string} cert.projectTitle
 * @param {number} cert.finalScore
 * @param {string[]} cert.techStack
 * @param {string[]} cert.skillTags
 * @param {{ google: number, startup: number, mnc: number }} cert.companyFit
 * @param {Date}   cert.issuedAt
 * @param {import('http').ServerResponse} res - Express response stream
 */
function generateCertificatePDF(cert, res) {
    const {
        certificationId,
        developerName,
        projectTitle,
        finalScore,
        techStack = [],
        skillTags = [],
        companyFit = {},
        issuedAt,
    } = cert;

    const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 60,
        info: {
            Title: `SkillProof Certificate — ${certificationId}`,
            Author: "SkillProof",
            Subject: `Project evaluation certificate for ${developerName}`,
        },
    });

    // ── Pipe to response ──────────────────────────────────────────────────────
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="SkillProof-${certificationId}.pdf"`
    );
    doc.pipe(res);

    const W = doc.page.width;
    const H = doc.page.height;
    const M = 60; // margin

    // ── Background ────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill("#0a0a12");

    // ── Decorative border ─────────────────────────────────────────────────────
    doc.rect(M - 10, M - 10, W - 2 * (M - 10), H - 2 * (M - 10))
        .lineWidth(2)
        .strokeColor("#6C63FF")
        .stroke();

    doc.rect(M - 6, M - 6, W - 2 * (M - 6), H - 2 * (M - 6))
        .lineWidth(0.5)
        .strokeColor("#6C63FF")
        .stroke();

    // ── Header: SkillProof branding ───────────────────────────────────────────
    doc.fontSize(11).fillColor("#6C63FF").text("SKILLPROOF", M, M + 10, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(8).fillColor("#888").text("AI-Powered Developer Certification", { align: "center" });

    // ── Certificate title ─────────────────────────────────────────────────────
    doc.moveDown(1.5);
    doc.fontSize(22).fillColor("#ffffff").text("Certificate of Technical Excellence", { align: "center" });

    // ── Recipient ─────────────────────────────────────────────────────────────
    doc.moveDown(0.8);
    doc.fontSize(11).fillColor("#aaa").text("This certifies that", { align: "center" });
    doc.moveDown(0.4);
    doc.fontSize(26).fillColor("#6C63FF").text(developerName, { align: "center" });

    // ── Project ───────────────────────────────────────────────────────────────
    doc.moveDown(0.6);
    doc.fontSize(10).fillColor("#aaa").text("has successfully demonstrated technical expertise on the project", { align: "center" });
    doc.moveDown(0.4);
    doc.fontSize(16).fillColor("#ffffff").text(`"${projectTitle}"`, { align: "center" });

    // ── Score ─────────────────────────────────────────────────────────────────
    doc.moveDown(1);
    doc.fontSize(42).fillColor("#6C63FF").text(`${finalScore}/100`, { align: "center" });
    doc.fontSize(9).fillColor("#888").text("Overall SkillProof Score", { align: "center" });

    // ── Company Fit scores ────────────────────────────────────────────────────
    if (companyFit.google || companyFit.startup || companyFit.mnc) {
        doc.moveDown(0.8);
        const fitY = doc.y;
        const col = (W - 2 * M) / 3;

        const fits = [
            { label: "Google Fit", score: companyFit.google },
            { label: "Startup Fit", score: companyFit.startup },
            { label: "Enterprise Fit", score: companyFit.mnc },
        ];

        fits.forEach((fit, i) => {
            const x = M + i * col + col / 2;
            doc.fontSize(18).fillColor("#6C63FF").text(`${fit.score}%`, x - 40, fitY, { width: 80, align: "center" });
            doc.fontSize(8).fillColor("#999").text(fit.label, x - 40, fitY + 22, { width: 80, align: "center" });
        });

        doc.y = fitY + 45;
    }

    // ── Tech Stack & Skills ───────────────────────────────────────────────────
    if (techStack.length || skillTags.length) {
        doc.moveDown(0.8);
        const tags = [...new Set([...techStack, ...skillTags])].slice(0, 10);
        doc.fontSize(8).fillColor("#6C63FF").text(tags.join("  ·  "), { align: "center" });
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = H - M - 10;
    const issuedDate = issuedAt
        ? new Date(issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    doc.fontSize(7)
        .fillColor("#555")
        .text(`Certificate ID: ${certificationId}`, M, footerY - 10)
        .text(`Issued: ${issuedDate}`, M, footerY)
        .text("Verify at: skillproof.dev/verify", { align: "right" });

    doc.end();
}

module.exports = { generateCertificatePDF };
