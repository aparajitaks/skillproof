import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, ResponsiveContainer, Tooltip
} from "recharts";
import api from "../api/axios";

// Thresholds for 0–9 scale:  0–2 Basic | 3–5 Intermediate | 6–9 Advanced
const getScoreColor = (score) => {
    if (score >= 6) return "var(--success)";
    if (score >= 3) return "var(--warning)";
    return "var(--danger)";
};

const getScoreLabel = (score) => {
    if (score >= 6) return "Advanced";
    if (score >= 3) return "Intermediate";
    return "Basic";
};

const ScoreBar = ({ label, score }) => (
    <div className="score-bar-wrap">
        <div className="score-bar-header">
            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{label}</span>
            <span style={{ color: getScoreColor(score), fontWeight: 600, fontSize: "0.85rem" }}>
                {score}/9 — {getScoreLabel(score)}
            </span>
        </div>
        <div className="score-bar-track">
            <div
                className="score-bar-fill"
                style={{
                    width: `${(score / 9) * 100}%`,
                    background: `linear-gradient(90deg, ${getScoreColor(score)}, var(--accent))`,
                }}
            />
        </div>
    </div>
);

const BADGE_DEFS = [
    { id: "first_project", icon: "🚀", label: "Pioneer" },
    { id: "score_8_plus", icon: "⭐", label: "Top Scorer" },
    { id: "advanced_arch", icon: "🏛️", label: "Architect" },
    { id: "full_stack", icon: "🔧", label: "Full-Stack" },
];

const ProjectDetails = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!id || id === "undefined") {
            setError("Invalid project ID.");
            setLoading(false);
            return;
        }
        const fetchProject = async () => {
            try {
                const { data } = await api.get(`/projects/${id}`);
                setProject(data.project || data); // unwrap { success, project } shape
            } catch (err) {
                setError(err.response?.data?.message || "Project not found.");
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    if (loading) return <div className="page-center"><span className="spinner" style={{ width: 40, height: 40 }} /></div>;

    if (error) return (
        <div className="page">
            <div className="error-box">{error}</div>
            <Link to="/dashboard" className="btn btn-ghost" style={{ marginTop: "16px" }}>← Dashboard</Link>
        </div>
    );

    const { title, githubUrl, description, techStack, evaluation, finalScore, status, createdAt } = project;
    const hasEvaluation = status === "evaluated" && evaluation;

    // Build radar chart data from evaluation — domain 0–9
    const radarData = hasEvaluation ? [
        { subject: "Architecture", score: evaluation.architectureScore, fullMark: 9 },
        { subject: "Code Quality", score: evaluation.codeQualityScore, fullMark: 9 },
        { subject: "Scalability", score: evaluation.scalabilityScore, fullMark: 9 },
        { subject: "Innovation", score: evaluation.innovationScore || 0, fullMark: 9 },
        { subject: "Real Impact", score: evaluation.realWorldImpactScore || 0, fullMark: 9 },
    ] : [];

    const handleShare = () => {
        const text = `🚀 Just got my project "${title}" evaluated on SkillProof!\n\n⭐ Score: ${finalScore}/9 — ${getScoreLabel(finalScore)}\n\nCheck out my developer profile 👇`;
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(text)}`;
        window.open(url, "_blank");
    };

    const handleCopyBullets = () => {
        const text = evaluation?.resumeBullets?.join("\n• ") || "";
        navigator.clipboard.writeText("• " + text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="page" style={{ maxWidth: "820px" }}>
            <Link to="/dashboard" style={{ color: "var(--text-muted)", fontSize: "0.9rem", textDecoration: "none" }}>
                ← Back to Dashboard
            </Link>

            {/* ── Header ── */}
            <div style={{ marginTop: "24px", marginBottom: "32px", display: "flex", gap: "20px", alignItems: "flex-start" }}>
                {finalScore !== null && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                        <div style={{
                            width: "80px", height: "80px", borderRadius: "50%",
                            border: `3px solid ${getScoreColor(finalScore)}`,
                            background: "rgba(99,102,241,0.1)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "1.8rem", fontWeight: 800, color: getScoreColor(finalScore),
                        }}>
                            {finalScore}
                        </div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>
                            {getScoreLabel(finalScore).toUpperCase()}
                        </span>
                    </div>
                )}

                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: "1.6rem" }}>{title}</h1>
                    <a href={githubUrl} target="_blank" rel="noopener noreferrer"
                        style={{ color: "var(--accent)", fontSize: "0.9rem", wordBreak: "break-all" }}>
                        {githubUrl}
                    </a>
                    <p style={{ marginTop: "8px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        Submitted {new Date(createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                    {hasEvaluation && (
                        <button onClick={handleShare} className="btn btn-ghost" style={{ marginTop: "12px", fontSize: "0.8rem", padding: "6px 14px" }}>
                            📤 Share on LinkedIn
                        </button>
                    )}
                </div>
            </div>

            {/* ── Description ── */}
            <div className="card" style={{ marginBottom: "20px" }}>
                <h3 style={{ marginBottom: "12px" }}>Description</h3>
                <p style={{ lineHeight: 1.7 }}>{description}</p>
                {techStack?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}>
                        {techStack.map((t) => <span key={t} className="tag">{t}</span>)}
                    </div>
                )}
            </div>

            {/* ── Evaluation Results ── */}
            {hasEvaluation ? (
                <>
                    {/* Radar Chart — domain 0–9 */}
                    <div className="card" style={{ marginBottom: "20px" }}>
                        <h3 style={{ marginBottom: "20px" }}>🕸️ Skill Radar</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                <PolarAngleAxis
                                    dataKey="subject"
                                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                                />
                                <PolarRadiusAxis
                                    angle={90} domain={[0, 9]}
                                    tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                                />
                                <Radar
                                    name="Score" dataKey="score"
                                    stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.25}
                                    strokeWidth={2}
                                />
                                <Tooltip
                                    formatter={(val) => [`${val}/9`, "Score"]}
                                    contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px" }}
                                    labelStyle={{ color: "var(--text-primary)" }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Score Bars */}
                    <div className="card" style={{ marginBottom: "20px" }}>
                        <h3 style={{ marginBottom: "20px" }}>📊 AI Score Breakdown</h3>
                        <ScoreBar label="Architecture" score={evaluation.architectureScore} />
                        <ScoreBar label="Code Quality" score={evaluation.codeQualityScore} />
                        <ScoreBar label="Scalability" score={evaluation.scalabilityScore} />
                        <ScoreBar label="Innovation" score={evaluation.innovationScore || 0} />
                        <ScoreBar label="Real-World Impact" score={evaluation.realWorldImpactScore || 0} />
                        <ScoreBar label="Overall Complexity" score={evaluation.complexity} />
                    </div>

                    {/* Strengths & Weaknesses */}
                    {(evaluation.strengths?.length > 0 || evaluation.weaknesses?.length > 0) && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                            {evaluation.strengths?.length > 0 && (
                                <div className="card">
                                    <h3 style={{ marginBottom: "14px", color: "var(--success)" }}>✅ Strengths</h3>
                                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                                        {evaluation.strengths.map((s, i) => (
                                            <li key={i} style={{ display: "flex", gap: "10px" }}>
                                                <span style={{ color: "var(--success)", flexShrink: 0 }}>▸</span>
                                                <span style={{ color: "var(--text-secondary)", lineHeight: 1.5, fontSize: "0.88rem" }}>{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {evaluation.weaknesses?.length > 0 && (
                                <div className="card">
                                    <h3 style={{ marginBottom: "14px", color: "var(--warning)" }}>⚠️ Weaknesses</h3>
                                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                                        {evaluation.weaknesses.map((w, i) => (
                                            <li key={i} style={{ display: "flex", gap: "10px" }}>
                                                <span style={{ color: "var(--warning)", flexShrink: 0 }}>▸</span>
                                                <span style={{ color: "var(--text-secondary)", lineHeight: 1.5, fontSize: "0.88rem" }}>{w}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Resume Bullets */}
                    {evaluation.resumeBullets?.length > 0 && (
                        <div className="card" style={{ marginBottom: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                                <h3>📄 Resume Bullets</h3>
                                <button onClick={handleCopyBullets} className="btn btn-ghost" style={{ fontSize: "0.78rem", padding: "4px 12px" }}>
                                    {copied ? "✅ Copied!" : "Copy All"}
                                </button>
                            </div>
                            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                                {evaluation.resumeBullets.map((b, i) => (
                                    <li key={i} style={{
                                        display: "flex", gap: "12px",
                                        background: "rgba(99,102,241,0.06)",
                                        padding: "12px 14px", borderRadius: "8px",
                                        borderLeft: "3px solid var(--accent)",
                                    }}>
                                        <span style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.88rem" }}>{b}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Skill Tags */}
                    {evaluation.skillTags?.length > 0 && (
                        <div className="card" style={{ marginBottom: "20px" }}>
                            <h3 style={{ marginBottom: "16px" }}>🏷️ Skill Tags</h3>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {evaluation.skillTags.map((t) => <span key={t} className="tag tag-accent">{t}</span>)}
                            </div>
                        </div>
                    )}

                    {/* Improvements */}
                    {evaluation.improvements?.length > 0 && (
                        <div className="card" style={{ marginBottom: "20px" }}>
                            <h3 style={{ marginBottom: "16px" }}>💡 AI Recommendations</h3>
                            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                                {evaluation.improvements.map((item, i) => (
                                    <li key={i} style={{ display: "flex", gap: "12px" }}>
                                        <span style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}>
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <span style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Next Learning Path */}
                    {evaluation.nextLearningPath?.length > 0 && (
                        <div className="card" style={{ marginBottom: "20px" }}>
                            <h3 style={{ marginBottom: "16px" }}>🗺️ Your Next Learning Path</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {evaluation.nextLearningPath.map((step, i) => (
                                    <div key={i} style={{
                                        display: "flex", gap: "14px", alignItems: "flex-start",
                                        padding: "12px 14px", borderRadius: "8px",
                                        background: "rgba(16,185,129,0.06)",
                                        borderLeft: "3px solid var(--success)",
                                    }}>
                                        <span style={{
                                            background: "var(--success)", color: "#000",
                                            borderRadius: "50%", width: "22px", height: "22px",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
                                        }}>{i + 1}</span>
                                        <span style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.88rem" }}>{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Company Fit — scores now 0–9, arc scaled accordingly */}
                    {evaluation.companyFit && (evaluation.companyFit.google > 0 || evaluation.companyFit.startup > 0 || evaluation.companyFit.mnc > 0) && (
                        <div className="card">
                            <h3 style={{ marginBottom: "8px" }}>🏢 Company-Fit Score</h3>
                            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "20px" }}>
                                How well does this project match what each company type looks for?
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                                {[
                                    { key: "google", label: "Google", emoji: "🔵", desc: "Systems & algorithms", color: "#4285F4" },
                                    { key: "startup", label: "Startup", emoji: "🚀", desc: "Speed & pragmatism", color: "var(--success)" },
                                    { key: "mnc", label: "Enterprise", emoji: "🏛️", desc: "Process & reliability", color: "var(--warning)" },
                                ].map(({ key, label, emoji, desc, color }) => {
                                    const score = evaluation.companyFit[key] ?? 0;
                                    // Arc: circumference = 2π×32 ≈ 201; fill proportional to score/9
                                    const arcFill = (score / 9) * 201;
                                    return (
                                        <div key={key} style={{ textAlign: "center" }}>
                                            <div style={{ position: "relative", width: "80px", height: "80px", margin: "0 auto 10px" }}>
                                                <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
                                                    <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                                                    <circle
                                                        cx="40" cy="40" r="32" fill="none"
                                                        stroke={color} strokeWidth="8"
                                                        strokeDasharray={`${arcFill} 201`}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div style={{
                                                    position: "absolute", inset: 0,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: "1rem", fontWeight: 800, color,
                                                }}>
                                                    {score}/9
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{emoji} {label}</div>
                                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "3px" }}>{desc}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="card" style={{ textAlign: "center", padding: "48px" }}>
                    {status === "pending" ? (
                        <>
                            <div className="spinner" style={{ width: 36, height: 36, margin: "0 auto 16px" }} />
                            <h3>Evaluation in progress</h3>
                            <p style={{ marginTop: "8px" }}>This usually takes under 30 seconds.</p>
                        </>
                    ) : (
                        <>
                            <h3 style={{ color: "var(--danger)" }}>Evaluation failed</h3>
                            <p style={{ marginTop: "8px" }}>The AI could not evaluate this project. Please resubmit.</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;
