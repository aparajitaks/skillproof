import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
// Set these in your Stripe Dashboard > Products and copy the price IDs:
const PRICE_PRO_MONTHLY = import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || "";
const PRICE_PRO_ANNUAL = import.meta.env.VITE_STRIPE_PRICE_PRO_ANNUAL || "";

const PLANS = [
    {
        tier: "free",
        name: "Free",
        price: "$0",
        period: "forever",
        tagline: "Try SkillProof risk-free",
        color: "var(--text-muted)",
        accent: "rgba(255,255,255,0.06)",
        border: "var(--border)",
        cta: "Get Started Free",
        ctaTo: "/register",
        ctaClass: "btn-ghost",
        features: [
            { text: "3 AI project evaluations", ok: true },
            { text: "5-dimension radar score", ok: true },
            { text: "Resume bullets (copy-paste)", ok: true },
            { text: "Shareable public profile", ok: true },
            { text: "Global leaderboard ranking", ok: true },
            { text: "Unlimited evaluations", ok: false },
            { text: "Company-fit scoring", ok: false },
            { text: "Certification badges", ok: false },
            { text: "Priority AI queue", ok: false },
        ],
    },
    {
        tier: "pro",
        name: "Pro",
        price: "$9",
        period: "per month",
        tagline: "For serious job seekers",
        color: "var(--accent)",
        accent: "rgba(99,102,241,0.08)",
        border: "rgba(99,102,241,0.4)",
        badge: "Most Popular",
        cta: "Upgrade to Pro",
        ctaTo: "/register",
        ctaClass: "btn-primary",
        features: [
            { text: "Unlimited AI evaluations", ok: true },
            { text: "5-dimension radar score", ok: true },
            { text: "Resume bullets (copy-paste)", ok: true },
            { text: "Shareable public profile", ok: true },
            { text: "Global leaderboard ranking", ok: true },
            { text: "Company-fit scoring (Google/Startup/MNC)", ok: true },
            { text: "Downloadable certification badges", ok: true },
            { text: "Priority AI queue", ok: true },
            { text: "Team dashboard", ok: false },
        ],
    },
    {
        tier: "team",
        name: "Team",
        price: "$49",
        period: "per month",
        tagline: "For engineering managers & bootcamps",
        color: "var(--success)",
        accent: "rgba(16,185,129,0.07)",
        border: "rgba(16,185,129,0.35)",
        cta: "Contact Sales",
        ctaTo: "mailto:hello@skillproof.io",
        ctaClass: "btn-ghost",
        features: [
            { text: "Everything in Pro", ok: true },
            { text: "Up to 20 team members", ok: true },
            { text: "Team analytics dashboard", ok: true },
            { text: "Cohort comparisons", ok: true },
            { text: "Bulk CSV export", ok: true },
            { text: "Custom company-fit targets", ok: true },
            { text: "White-label certificates", ok: true },
            { text: "Dedicated Slack support", ok: true },
            { text: "SSO / SAML", ok: true },
        ],
    },
];

const Pricing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [billing, setBilling] = useState("monthly"); // 'monthly' | 'annual'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleUpgrade = async () => {
        if (!user) { navigate("/register"); return; }
        if (user.plan === "pro") { navigate("/dashboard"); return; }

        const priceId = billing === "annual" ? PRICE_PRO_ANNUAL : PRICE_PRO_MONTHLY;
        if (!priceId) {
            setError("Stripe is not configured yet. Set VITE_STRIPE_PRICE_PRO_MONTHLY in .env");
            return;
        }

        try {
            setLoading(true);
            setError("");
            const token = localStorage.getItem("token");
            const { data } = await axios.post(
                `${API}/billing/create-checkout-session`,
                { priceId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            window.location.href = data.url; // Redirect to Stripe Checkout
        } catch (err) {
            setError(err.response?.data?.message || "Failed to start checkout. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page" style={{ maxWidth: "980px" }}>
            {/* ── Header ── */}
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
                <div style={{
                    display: "inline-block", padding: "6px 14px", borderRadius: "999px",
                    background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
                    fontSize: "0.78rem", color: "var(--accent)", fontWeight: 600, marginBottom: "20px",
                    letterSpacing: "0.05em",
                }}>
                    SIMPLE PRICING
                </div>
                <h1 style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "16px" }}>
                    Invest in your career
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "480px", margin: "0 auto" }}>
                    Get AI-verified proof of your skills. Recruiters trust it. Developers love it.
                </p>
            </div>

            {/* ── Billing Toggle ── */}
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "2rem" }}>
                {["monthly", "annual"].map(b => (
                    <button key={b} onClick={() => setBilling(b)}
                        style={{
                            padding: "0.4rem 1.2rem", borderRadius: "999px", fontWeight: 600,
                            fontSize: "0.8rem", cursor: "pointer", border: "1px solid var(--border)",
                            background: billing === b ? "var(--accent)" : "transparent",
                            color: billing === b ? "#fff" : "var(--text-muted)",
                        }}>
                        {b === "monthly" ? "Monthly" : "Annual (save 20%)"}
                    </button>
                ))}
            </div>

            {error && (
                <div style={{ textAlign: "center", color: "#ef4444", marginBottom: "1rem", fontSize: "0.875rem" }}>
                    {error}
                </div>
            )}

            {/* ── Tier Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "64px" }}>
                {PLANS.map((plan) => (
                    <div key={plan.tier} style={{
                        borderRadius: "16px", padding: "28px",
                        background: plan.accent,
                        border: `1px solid ${plan.border}`,
                        position: "relative",
                        display: "flex", flexDirection: "column",
                        transition: "transform 0.2s",
                    }}>
                        {plan.badge && (
                            <div style={{
                                position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                                background: "var(--accent)", color: "#fff",
                                fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em",
                                padding: "4px 14px", borderRadius: "999px",
                            }}>
                                {plan.badge}
                            </div>
                        )}

                        <div style={{ marginBottom: "24px" }}>
                            <div style={{ fontSize: "0.75rem", color: plan.color, fontWeight: 700, letterSpacing: "0.08em", marginBottom: "8px" }}>
                                {plan.name.toUpperCase()}
                            </div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" }}>
                                <span style={{ fontSize: "2.6rem", fontWeight: 900, color: "var(--text-primary)" }}>{plan.price}</span>
                                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>/ {plan.period}</span>
                            </div>
                            <div style={{ fontSize: "0.83rem", color: "var(--text-muted)" }}>{plan.tagline}</div>
                        </div>

                        {/* Pro tier CTA → Stripe Checkout */}
                        {plan.tier === "pro" ? (
                            <button
                                onClick={handleUpgrade}
                                disabled={loading}
                                className={`btn ${plan.ctaClass}`}
                                style={{ display: "block", textAlign: "center", marginBottom: "24px", padding: "11px", cursor: loading ? "wait" : "pointer" }}
                            >
                                {loading ? "Loading…" : user?.plan === "pro" ? "You're on Pro ✓" : plan.cta}
                            </button>
                        ) : (
                            <Link
                                to={plan.ctaTo}
                                className={`btn ${plan.ctaClass}`}
                                style={{ display: "block", textAlign: "center", marginBottom: "24px", padding: "11px" }}
                            >
                                {plan.cta}
                            </Link>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "11px", flex: 1 }}>
                            {plan.features.map((f) => (
                                <div key={f.text} style={{
                                    display: "flex", alignItems: "flex-start", gap: "10px",
                                    opacity: f.ok ? 1 : 0.35,
                                }}>
                                    <span style={{ fontSize: "0.9rem", flexShrink: 0, marginTop: "1px" }}>
                                        {f.ok ? "✓" : "×"}
                                    </span>
                                    <span style={{ fontSize: "0.84rem", color: f.ok ? "var(--text-secondary)" : "var(--text-muted)", lineHeight: 1.5 }}>
                                        {f.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── FAQ ── */}
            <div style={{ maxWidth: "640px", margin: "0 auto" }}>
                <h2 style={{ fontSize: "1.3rem", marginBottom: "28px", textAlign: "center" }}>Common Questions</h2>
                {[
                    {
                        q: "What counts as an evaluation?",
                        a: "Each project submission that gets a score uses one evaluation. Re-submissions of the same project each cost one evaluation.",
                    },
                    {
                        q: "How accurate is the AI scoring?",
                        a: "Scores are generated by Llama 3.3 70B via Groq, then deterministically re-weighted server-side so results are consistent and tamper-proof.",
                    },
                    {
                        q: "Can I share my profile before upgrading?",
                        a: "Yes. Your public profile at /u/your-slug is always live and free. Certification badges and company-fit scores require Pro.",
                    },
                    {
                        q: "Is Stripe payment secure?",
                        a: "All payments are processed by Stripe. SkillProof never stores card numbers.",
                    },
                ].map(({ q, a }) => (
                    <div key={q} style={{ marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ fontWeight: 600, marginBottom: "8px", fontSize: "0.95rem" }}>{q}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.7 }}>{a}</div>
                    </div>
                ))}
            </div>

            {/* ── Bottom CTA ── */}
            <div style={{ textAlign: "center", marginTop: "48px", padding: "40px", borderRadius: "16px", background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "12px" }}>Ready to prove your skills?</h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
                    Join 1,000+ developers who use SkillProof to land their next role.
                </p>
                {user ? (
                    <Link to="/dashboard" className="btn btn-primary" style={{ padding: "12px 32px" }}>Go to Dashboard</Link>
                ) : (
                    <Link to="/register" className="btn btn-primary" style={{ padding: "12px 32px" }}>Start Free — No Credit Card</Link>
                )}
            </div>
        </div>
    );
};

export default Pricing;

