import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const MEDALS = ["1st", "2nd", "3rd"];

const getScoreColor = (score) => {
    if (score >= 8) return "var(--success)";
    if (score >= 5) return "var(--warning)";
    return "var(--danger)";
};

const Leaderboard = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await api.get("/leaderboard");
                setEntries(data.leaderboard);
            } catch {
                setError("Could not load leaderboard. Try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    return (
        <div className="page" style={{ maxWidth: "860px" }}>
            {/* ── Header ── */}
            <div style={{ marginBottom: "36px" }}>
                <h1 style={{ fontSize: "2rem" }}>Developer Leaderboard</h1>
                <p style={{ marginTop: "8px", color: "var(--text-secondary)" }}>
                    Top-ranked developers by AI project score. Updated in real-time.
                </p>
            </div>

            {loading && (
                <div style={{ textAlign: "center", padding: "64px" }}>
                    <span className="spinner" style={{ width: 36, height: 36 }} />
                </div>
            )}

            {error && <div className="error-box">{error}</div>}

            {!loading && entries.length === 0 && !error && (
                <div className="empty-state">
                    <div style={{ fontSize: "3rem", marginBottom: "16px" }}></div>
                    <h3>No entries yet</h3>
                    <p>Be the first one on the board — submit a project!</p>
                    <Link to="/projects/new" className="btn btn-primary" style={{ marginTop: "20px" }}>
                        Submit a Project
                    </Link>
                </div>
            )}

            {!loading && entries.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {entries.map((entry) => (
                        <div
                            key={entry.userId}
                            className="card"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "20px",
                                flexWrap: "wrap",
                                // Highlight top 3
                                border: entry.rank <= 3
                                    ? "1px solid rgba(99,102,241,0.4)"
                                    : "1px solid var(--border)",
                                background: entry.rank === 1
                                    ? "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(16,185,129,0.05))"
                                    : "var(--surface)",
                            }}
                        >
                            {/* Rank */}
                            <div style={{
                                width: "44px", textAlign: "center", flexShrink: 0,
                                fontSize: entry.rank <= 3 ? "1.6rem" : "1.1rem",
                                fontWeight: 800,
                                color: entry.rank <= 3 ? "inherit" : "var(--text-muted)",
                            }}>
                                {entry.rank <= 3 ? MEDALS[entry.rank - 1] : `#${entry.rank}`}
                            </div>

                            {/* Avatar */}
                            <div style={{
                                width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0,
                                background: "linear-gradient(135deg, var(--accent), var(--success))",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "1.1rem", fontWeight: 800, color: "#fff",
                            }}>
                                {entry.name?.charAt(0).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: "160px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                    <span style={{ fontWeight: 700, fontSize: "1rem" }}>{entry.name}</span>
                                    {entry.topProjectTitle && (
                                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                            best: {entry.topProjectTitle}
                                        </span>
                                    )}
                                </div>
                                {entry.topSkillTags?.length > 0 && (
                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                                        {entry.topSkillTags.map((t) => (
                                            <span key={t} className="tag" style={{ fontSize: "0.72rem" }}>{t}</span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            <div style={{ display: "flex", gap: "20px", alignItems: "center", flexShrink: 0 }}>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: getScoreColor(entry.topScore) }}>
                                        {entry.topScore}
                                    </div>
                                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>top score</div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                                        {entry.avgScore}
                                    </div>
                                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>avg</div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                                        {entry.projectCount}
                                    </div>
                                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>projects</div>
                                </div>
                            </div>

                            {/* Profile link */}
                            {entry.slug && (
                                <Link
                                    to={`/u/${entry.slug}`}
                                    className="btn btn-ghost"
                                    style={{ fontSize: "0.78rem", padding: "6px 14px", flexShrink: 0 }}
                                >
                                    View →
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div style={{ textAlign: "center", marginTop: "40px" }}>
                <Link to="/projects/new" className="btn btn-primary">
                    Submit a Project to Rank Up
                </Link>
            </div>
        </div>
    );
};

export default Leaderboard;
