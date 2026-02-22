import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";

const SCORE_LABEL = (s) => {
    if (s >= 9) return "Exceptional";
    if (s >= 7) return "Advanced";
    if (s >= 5) return "Intermediate";
    return "Beginner";
};

const Certificate = () => {
    const { certId } = useParams();
    const [cert, setCert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchCert = async () => {
            try {
                const { data } = await api.get(`/projects/cert/${certId}`);
                setCert(data);
            } catch {
                setError("Certificate not found or has been revoked.");
            } finally {
                setLoading(false);
            }
        };
        fetchCert();
    }, [certId]);

    const handlePrint = () => window.print();

    if (loading) return (
        <div className="page-center">
            <span className="spinner" style={{ width: 40, height: 40 }} />
        </div>
    );

    if (error) return (
        <div className="page" style={{ maxWidth: "560px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
            <h2>{error}</h2>
            <Link to="/" className="btn btn-ghost" style={{ marginTop: "24px" }}>← Back to Home</Link>
        </div>
    );

    const issued = new Date(cert.issuedAt).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
    });

    const scoreColor = cert.finalScore >= 8 ? "#10B981" : cert.finalScore >= 5 ? "#F59E0B" : "#EF4444";

    return (
        <div className="page" style={{ maxWidth: "760px" }}>
            {/* Print button — hidden in print */}
            <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginBottom: "28px" }}>
                <button onClick={handlePrint} className="btn btn-ghost">🖨️ Print / Save PDF</button>
                {cert.publicProfileSlug && (
                    <Link to={`/u/${cert.publicProfileSlug}`} className="btn btn-ghost">
                        View Profile →
                    </Link>
                )}
            </div>

            {/* ── Certificate Card ── */}
            <div id="certificate" style={{
                background: "linear-gradient(135deg, #0d1225 0%, #0a0e1a 60%, #0d1a0d 100%)",
                border: "2px solid rgba(99,102,241,0.4)",
                borderRadius: "20px",
                padding: "56px 64px",
                position: "relative",
                overflow: "hidden",
                textAlign: "center",
            }}>
                {/* Decorative corner glows */}
                <div style={{
                    position: "absolute", top: 0, left: 0, width: "180px", height: "180px",
                    background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
                    borderRadius: "50%", transform: "translate(-50%, -50%)",
                }} />
                <div style={{
                    position: "absolute", bottom: 0, right: 0, width: "200px", height: "200px",
                    background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
                    borderRadius: "50%", transform: "translate(40%, 40%)",
                }} />

                {/* Logo */}
                <div style={{ marginBottom: "32px", position: "relative" }}>
                    <div style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.03em" }}>
                        ⚡ SkillProof
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", marginTop: "4px" }}>
                        AI SKILL INTELLIGENCE
                    </div>
                </div>

                {/* Certificate of Excellence heading */}
                <div style={{
                    fontSize: "0.7rem", letterSpacing: "0.2em", color: "rgba(99,102,241,0.9)",
                    fontWeight: 700, marginBottom: "28px",
                }}>
                    CERTIFICATE OF ACHIEVEMENT
                </div>

                {/* Developer name */}
                <div style={{ fontSize: "2.2rem", fontWeight: 900, marginBottom: "8px", letterSpacing: "-0.02em" }}>
                    {cert.developerName}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", marginBottom: "36px" }}>
                    has successfully completed an AI-verified project evaluation
                </div>

                {/* Project name */}
                <div style={{
                    display: "inline-block",
                    background: "rgba(99,102,241,0.12)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: "10px",
                    padding: "16px 32px",
                    marginBottom: "36px",
                }}>
                    <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: "6px" }}>PROJECT</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{cert.projectTitle}</div>
                </div>

                {/* Score circle */}
                <div style={{ margin: "0 auto 36px", width: "110px", height: "110px", position: "relative" }}>
                    <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                        <circle
                            cx="55" cy="55" r="46" fill="none"
                            stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
                            strokeDasharray={`${(cert.finalScore / 10) * 289} 289`}
                        />
                    </svg>
                    <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    }}>
                        <div style={{ fontSize: "2rem", fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                            {cert.finalScore}
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>/ 10</div>
                    </div>
                </div>

                {/* Score label */}
                <div style={{ fontSize: "1rem", fontWeight: 700, color: scoreColor, marginBottom: "8px" }}>
                    {SCORE_LABEL(cert.finalScore)} Level
                </div>

                {/* Tech tags */}
                {cert.techStack?.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "36px" }}>
                        {cert.techStack.map((t) => (
                            <span key={t} style={{
                                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                                borderRadius: "999px", padding: "4px 12px", fontSize: "0.76rem", color: "rgba(255,255,255,0.6)",
                            }}>{t}</span>
                        ))}
                    </div>
                )}

                {/* Company fit row */}
                {cert.companyFit && (cert.companyFit.google > 0 || cert.companyFit.startup > 0 || cert.companyFit.mnc > 0) && (
                    <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginBottom: "36px" }}>
                        {[
                            { key: "google", label: "🔵 Google", color: "#4285F4" },
                            { key: "startup", label: "🚀 Startup", color: "#10B981" },
                            { key: "mnc", label: "🏛️ Enterprise", color: "#F59E0B" },
                        ].map(({ key, label, color }) => (
                            <div key={key} style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "1.2rem", fontWeight: 800, color }}>
                                    {cert.companyFit[key]}%
                                </div>
                                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", marginTop: "3px" }}>{label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Divider */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "24px", marginTop: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ textAlign: "left" }}>
                            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>ISSUED</div>
                            <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", marginTop: "3px" }}>{issued}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>CERT ID</div>
                            <div style={{ fontSize: "0.85rem", fontFamily: "monospace", color: "rgba(99,102,241,0.9)", marginTop: "3px" }}>
                                {cert.certificationId}
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>VERIFY AT</div>
                            <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", marginTop: "3px" }}>
                                skillproof.io/cert/{cert.certificationId}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Share row */}
            <div className="no-print" style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "center" }}>
                <a
                    href={`https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                >
                    📤 Share on LinkedIn
                </a>
                <button
                    className="btn btn-ghost"
                    onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                    }}
                >
                    🔗 Copy Link
                </button>
            </div>
        </div>
    );
};

export default Certificate;
