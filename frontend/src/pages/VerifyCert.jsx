import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export default function VerifyCert() {
    const { certId } = useParams();
    const [cert, setCert] = useState(null);
    const [verify, setVerify] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchCert = async () => {
            try {
                const [metaRes, verifyRes] = await Promise.all([
                    axios.get(`${API}/cert/${certId}`),
                    axios.get(`${API}/cert/${certId}/verify`),
                ]);
                setCert(metaRes.data);
                setVerify(verifyRes.data);
            } catch {
                setError("Certificate not found or invalid ID.");
            } finally {
                setLoading(false);
            }
        };
        fetchCert();
    }, [certId]);

    const handleLinkedInShare = () => {
        const certUrl = `${window.location.origin}/verify/${certId}`;
        const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certUrl)}`;
        window.open(shareUrl, "_blank", "noopener,noreferrer");
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/verify/${certId}`);
        alert("Certificate link copied!");
    };

    const badgeMarkdown = `[![SkillProof Certified](${API}/cert/${certId}/badge.svg)](${window.location.origin}/verify/${certId})`;

    if (loading) return (
        <div className="page-center">
            <div className="spinner" />
            <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>Loading certificate…</p>
        </div>
    );

    if (error) return (
        <div className="page-center">
            <div style={{ textAlign: "center" }}>
                <h2 style={{ color: "var(--accent)" }}>❌ {error}</h2>
                <Link to="/" className="btn-primary" style={{ marginTop: "1.5rem", display: "inline-block" }}>
                    Go to SkillProof
                </Link>
            </div>
        </div>
    );

    const isValid = verify?.valid;
    const score = cert?.finalScore ?? 0;
    const scoreColor = score >= 80 ? "#6C63FF" : score >= 60 ? "#f59e0b" : "#ef4444";

    return (
        <div className="page-container" style={{ maxWidth: "760px", margin: "0 auto", padding: "2rem 1rem" }}>
            {/* Validity Banner */}
            <div style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.875rem 1.25rem", borderRadius: "10px", marginBottom: "2rem",
                background: isValid ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                border: `1px solid ${isValid ? "#10b981" : "#ef4444"}`,
            }}>
                <span style={{ fontSize: "1.5rem" }}>{isValid ? "✅" : "❌"}</span>
                <div>
                    <div style={{ fontWeight: 700, color: isValid ? "#10b981" : "#ef4444" }}>
                        {isValid ? "Valid Certificate" : "Invalid Certificate"}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {isValid
                            ? `Cryptographically verified · ID: ${certId}`
                            : "This certificate could not be verified — it may have been tampered with."}
                    </div>
                </div>
            </div>

            {/* Certificate Card */}
            <div className="card" style={{
                background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)",
                border: "2px solid var(--accent)",
                borderRadius: "16px", padding: "2.5rem", textAlign: "center",
            }}>
                <div style={{ fontSize: "0.75rem", letterSpacing: "0.15em", color: "var(--accent)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                    SkillProof Certification
                </div>
                <h1 style={{ fontSize: "1.1rem", color: "var(--text-muted)", margin: "0 0 0.5rem" }}>
                    Certificate of Technical Excellence
                </h1>
                <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 1rem" }}>This certifies that</p>

                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", margin: "0.25rem 0" }}>
                    {cert?.developerName}
                </div>

                <p style={{ color: "var(--text-muted)", margin: "0.75rem 0 0.25rem" }}>
                    has demonstrated technical excellence on
                </p>
                <div style={{ fontSize: "1.2rem", fontWeight: 600, color: "#fff", margin: "0.25rem 0 1.5rem" }}>
                    "{cert?.projectTitle}"
                </div>

                {/* Score */}
                <div style={{
                    fontSize: "4rem", fontWeight: 900, color: scoreColor,
                    lineHeight: 1, marginBottom: "0.25rem"
                }}>
                    {score}<span style={{ fontSize: "1.5rem", color: "var(--text-muted)" }}>/100</span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                    Overall SkillProof Score
                </div>

                {/* Company Fit */}
                {cert?.companyFit && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                        {[
                            { label: "Google Fit", val: cert.companyFit.google },
                            { label: "Startup Fit", val: cert.companyFit.startup },
                            { label: "Enterprise Fit", val: cert.companyFit.mnc },
                        ].map(f => (
                            <div key={f.label} style={{ background: "rgba(108,99,255,0.1)", borderRadius: "10px", padding: "0.75rem" }}>
                                <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--accent)" }}>{f.val}%</div>
                                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{f.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tech Stack */}
                {cert?.techStack?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", justifyContent: "center", marginBottom: "1.5rem" }}>
                        {cert.techStack.map(t => (
                            <span key={t} style={{
                                background: "rgba(108,99,255,0.15)", color: "var(--accent)",
                                padding: "0.2rem 0.75rem", borderRadius: "20px", fontSize: "0.75rem"
                            }}>{t}</span>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Issued: {cert?.issuedAt ? new Date(cert.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                    &nbsp;·&nbsp;ID: {cert?.certificationId}
                    &nbsp;·&nbsp;SkillProof.dev
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.5rem", justifyContent: "center" }}>
                <a
                    href={`${API}/cert/${certId}/pdf`}
                    target="_blank" rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ textDecoration: "none" }}
                >
                    📄 Download PDF
                </a>
                <button onClick={handleLinkedInShare} className="btn-secondary">
                    🔗 Share on LinkedIn
                </button>
                <button onClick={handleCopyLink} className="btn-secondary">
                    📋 Copy Link
                </button>
                {cert?.publicProfileSlug && (
                    <Link to={`/u/${cert.publicProfileSlug}`} className="btn-secondary">
                        👤 Developer Profile
                    </Link>
                )}
            </div>

            {/* GitHub Badge Embed */}
            <div className="card" style={{ marginTop: "1.5rem" }}>
                <h3 style={{ marginBottom: "0.75rem", fontSize: "0.9rem" }}>🏷️ GitHub README Badge</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                    Add this badge to your project README to showcase your certification:
                </p>
                <div style={{
                    background: "rgba(0,0,0,0.4)", borderRadius: "8px", padding: "0.875rem",
                    fontFamily: "monospace", fontSize: "0.7rem", color: "#a3e635", wordBreak: "break-all",
                    marginBottom: "0.75rem"
                }}>
                    {badgeMarkdown}
                </div>
                <button
                    className="btn-secondary"
                    style={{ fontSize: "0.8rem" }}
                    onClick={() => {
                        navigator.clipboard.writeText(badgeMarkdown);
                        alert("Badge markdown copied!");
                    }}
                >
                    Copy Badge Markdown
                </button>
            </div>

            <div style={{ textAlign: "center", marginTop: "2rem" }}>
                <Link to="/register" style={{ color: "var(--accent)", fontSize: "0.9rem" }}>
                    Get your own SkillProof certificate →
                </Link>
            </div>
        </div>
    );
}
