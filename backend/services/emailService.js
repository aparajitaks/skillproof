const { Resend } = require("resend");

// Lazy-initialize Resend client so the module can be imported even without
// RESEND_API_KEY set (e.g. in development). The client is created on first use.
let _resend = null;
function getResend() {
    if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
    return _resend;
}

const FROM = process.env.EMAIL_FROM || "SkillProof <noreply@skillproof.dev>";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Internal helper — send an email and swallow errors gracefully so
 * email failures never crash core request flows.
 */
async function send({ to, subject, html }) {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_placeholder") {
        console.log(`[email] Skipping (no RESEND_API_KEY) → To: ${to} | Subject: ${subject}`);
        return;
    }
    try {
        const { error } = await getResend().emails.send({ from: FROM, to, subject, html });
        if (error) console.error("[email] ❌ Resend error:", error);
        else console.log(`[email] ✅ Sent: ${subject} → ${to}`);
    } catch (err) {
        console.error("[email] ❌ Exception:", err.message);
    }
}

// ── Transactional emails ──────────────────────────────────────────────────────

exports.sendWelcomeEmail = async (user) => {
    await send({
        to: user.email,
        subject: "Welcome to SkillProof 🚀",
        html: `
      <h2>Welcome, ${user.name}!</h2>
      <p>You're on the <strong>Free plan</strong> with 3 AI evaluations per month.</p>
      <p><a href="${FRONTEND_URL}/dashboard">Start evaluating your projects →</a></p>
      <p>When you're ready for unlimited evaluations, <a href="${FRONTEND_URL}/pricing">upgrade to Pro</a>.</p>
      <br/><p>– The SkillProof Team</p>
    `,
    });
};

exports.sendVerificationEmail = async (user, token) => {
    const link = `${FRONTEND_URL}/verify-email?token=${token}`;
    await send({
        to: user.email,
        subject: "Verify your SkillProof email",
        html: `
      <h2>Hi ${user.name},</h2>
      <p>Please verify your email to unlock all features:</p>
      <p><a href="${link}" style="background:#6C63FF;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">Verify Email →</a></p>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't create an account, ignore this email.</p>
    `,
    });
};

exports.sendCertificateEmail = async (user, cert) => {
    const certUrl = `${FRONTEND_URL}/cert/${cert.certificationId}`;
    await send({
        to: user.email,
        subject: `Your SkillProof Certificate is ready — ${cert.projectTitle} 🏆`,
        html: `
      <h2>Congrats, ${user.name}! 🎉</h2>
      <p>Your project <strong>"${cert.projectTitle}"</strong> has been certified with a score of <strong>${cert.finalScore}/100</strong>.</p>
      <p><a href="${certUrl}" style="background:#6C63FF;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">View Certificate →</a></p>
      <p>Share it on LinkedIn or add the badge to your GitHub README!</p>
      <br/><p>– The SkillProof Team</p>
    `,
    });
};

exports.sendPaymentFailedEmail = async (user) => {
    await send({
        to: user.email,
        subject: "Action required: Update your SkillProof payment method",
        html: `
      <h2>Hi ${user.name},</h2>
      <p>Your recent payment for SkillProof Pro failed. You have a <strong>3-day grace period</strong> to update your payment method before access is downgraded.</p>
      <p><a href="${FRONTEND_URL}/billing" style="background:#ef4444;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">Update Payment Method →</a></p>
      <br/><p>– The SkillProof Team</p>
    `,
    });
};

exports.sendUpgradeNudgeEmail = async (user) => {
    await send({
        to: user.email,
        subject: `You've used ${user.evaluationsUsed}/${user.evaluationsLimit} evaluations this month`,
        html: `
      <h2>Running low, ${user.name}!</h2>
      <p>You've used <strong>${user.evaluationsUsed} of ${user.evaluationsLimit}</strong> free evaluations this month.</p>
      <p>Upgrade to Pro for <strong>unlimited evaluations</strong>, priority AI processing, and downloadable PDF certificates.</p>
      <p><a href="${FRONTEND_URL}/pricing" style="background:#6C63FF;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">Upgrade to Pro →</a></p>
    `,
    });
};
