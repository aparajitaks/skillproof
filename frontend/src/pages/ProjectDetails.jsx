import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";

const getScoreColor = (score) => {
    if (score >= 7) return "var(--success)";
    if (score >= 4) return "var(--warning)";
    return "var(--danger)";
};

const getScoreLabel = (score) => {
    if (score >= 7) return "Advanced";
    if (score >= 4) return "Intermediate";
    return "Basic";
};

const ScoreBar = ({ label, score }) => (
    <div className="score-bar-wrap">
        <div className="score-bar-header">
            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{label}</span>
            <span style={{ color: getScoreColor(score), fontWeight: 600, fontSize: "0.85rem" }}>
                {score}/10 — {getScoreLabel(score)}
            </span>
        </div>
        <div className="score-bar-track">
            <div
                className="score-bar-fill"
                style={{
                    width: `${(score / 10) * 100}%`,
                    background: `linear-gradient(90deg, ${getScoreColor(score)}, var(--accent))`,
                }}
            />
        </div>
    </div>
);

const ProjectDetails = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const { data } = await api.get(`/projects/${id}`);
                setProject(data);
            } catch (err) {
                setError(err.response?.data?.message || "Project not found.");
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    if (loading) {
        return (
            <div className="page-center">
                <span className="spinner" style={{ width: 40, height: 40 }} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="page">
                <div className="error-box">{error}</div>
                <Link to="/dashboard" className="btn btn-ghost" style={{ marginTop: "16px" }}>← Dashboard</Link>
            </div>
        );
    }

    const { title, githubUrl, description, techStack, evaluation, finalScore, status, createdAt } = project;
    const hasEvaluation = status === "evaluated" && evaluation;

    return (
        <div className="page" style={{ maxWidth: "780px" }}>
            <Link to="/dashboard" style={{ color: "var(--text-muted)", fontSize: "0.9rem", textDecoration: "none" }}>
                ← Back to Dashboard
            </Link>

            {/* ── Header ── */}
            <div style={{ marginTop: "24px", marginBottom: "32px", display: "flex", gap: "20px", alignItems: "flex-start" }}>
                {finalScore !== null && (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "4px",
                        flexShrink: 0,
                    }}>
                        <div style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "50%",
                            border: `3px solid ${getScoreColor(finalScore)}`,
                            background: "rgba(99,102,241,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.6rem",
                            fontWeight: 800,
                            color: getScoreColor(finalScore),
                        }}>
                            {finalScore}
                        </div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>
                            {getScoreLabel(finalScore).toUpperCase()}
                        </span>
                    </div>
                )}

                <div>
                    <h1 style={{ fontSize: "1.6rem" }}>{title}</h1>
                    <a
                        href={githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--accent)", fontSize: "0.9rem", wordBreak: "break-all" }}
                    >
                        {githubUrl}
                    </a>
                    <p style={{ marginTop: "8px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        Submitted {new Date(createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
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

            {/* ── AI Evaluation ── */}
            {hasEvaluation ? (
                <>
                    <div className="card" style={{ marginBottom: "20px" }}>
                        <h3 style={{ marginBottom: "20px" }}>AI Score Breakdown</h3>
                        <ScoreBar label="Architecture" score={evaluation.architectureScore} />
                        <ScoreBar label="Scalability" score={evaluation.scalabilityScore} />
                        <ScoreBar label="Code Quality" score={evaluation.codeQualityScore} />
                        <ScoreBar label="Overall Complexity" score={evaluation.complexity} />
                    </div>

                    {evaluation.skillTags?.length > 0 && (
                        <div className="card" style={{ marginBottom: "20px" }}>
                            <h3 style={{ marginBottom: "16px" }}>Skill Tags</h3>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {evaluation.skillTags.map((t) => <span key={t} className="tag tag-accent">{t}</span>)}
                            </div>
                        </div>
                    )}

                    {evaluation.improvements?.length > 0 && (
                        <div className="card">
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
