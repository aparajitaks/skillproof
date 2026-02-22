import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, ResponsiveContainer, Legend
} from "recharts";
import api from "../api/axios";

// Thresholds for 0–9 scale:  0–2 Basic | 3–5 Intermediate | 6–9 Advanced
const getScoreColor = (score) => {
    if (score >= 6) return "var(--success)";
    if (score >= 3) return "var(--warning)";
    return "var(--danger)";
};

const getDiffColor = (a, b) => {
    if (a > b) return "var(--success)";
    if (a < b) return "var(--danger)";
    return "var(--text-muted)";
};

const Compare = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selA, setSelA] = useState("");
    const [selB, setSelB] = useState("");

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data } = await api.get("/projects");
                const evaluated = data.projects.filter((p) => p.status === "evaluated");
                setProjects(evaluated);
                if (evaluated.length >= 1) setSelA(evaluated[0]._id);
                if (evaluated.length >= 2) setSelB(evaluated[1]._id);
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const projA = projects.find((p) => p._id === selA);
    const projB = projects.find((p) => p._id === selB);

    const DIMS = [
        { key: "architectureScore", label: "Architecture" },
        { key: "codeQualityScore", label: "Code Quality" },
        { key: "scalabilityScore", label: "Scalability" },
        { key: "innovationScore", label: "Innovation" },
        { key: "realWorldImpactScore", label: "Real Impact" },
    ];

    const radarData = DIMS.map(({ key, label }) => ({
        subject: label,
        A: projA?.evaluation?.[key] ?? 0,
        B: projB?.evaluation?.[key] ?? 0,
        fullMark: 9,
    }));

    if (loading) return (
        <div className="page-center">
            <span className="spinner" style={{ width: 36, height: 36 }} />
        </div>
    );

    if (projects.length < 2) return (
        <div className="page" style={{ maxWidth: "600px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "20px" }}>⚖️</div>
            <h2>Not enough projects to compare</h2>
            <p style={{ marginTop: "10px", color: "var(--text-secondary)" }}>
                You need at least 2 evaluated projects to use the comparison tool.
            </p>
            <Link to="/projects/new" className="btn btn-primary" style={{ marginTop: "24px" }}>
                Submit Another Project
            </Link>
        </div>
    );

    const canCompare = projA && projB && selA !== selB;

    return (
        <div className="page" style={{ maxWidth: "900px" }}>
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "1.8rem" }}>⚖️ Compare Projects</h1>
                <p style={{ marginTop: "8px", color: "var(--text-secondary)" }}>
                    Pick two of your evaluated projects to see a side-by-side breakdown.
                </p>
            </div>

            {/* ── Selectors ── */}
            <div className="card" style={{ marginBottom: "28px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "16px", alignItems: "center" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                            PROJECT A
                        </label>
                        <select
                            value={selA}
                            onChange={(e) => setSelA(e.target.value)}
                            style={{
                                width: "100%", background: "var(--bg)", color: "var(--text-primary)",
                                border: "1px solid var(--border)", borderRadius: "8px",
                                padding: "10px 12px", fontSize: "0.9rem",
                            }}
                        >
                            {projects.map((p) => (
                                <option key={p._id} value={p._id}>{p.title}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ textAlign: "center", fontSize: "1.4rem", color: "var(--text-muted)", marginTop: "20px" }}>vs</div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                            PROJECT B
                        </label>
                        <select
                            value={selB}
                            onChange={(e) => setSelB(e.target.value)}
                            style={{
                                width: "100%", background: "var(--bg)", color: "var(--text-primary)",
                                border: "1px solid var(--border)", borderRadius: "8px",
                                padding: "10px 12px", fontSize: "0.9rem",
                            }}
                        >
                            {projects.map((p) => (
                                <option key={p._id} value={p._id}>{p.title}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {selA === selB && (
                <div className="error-box" style={{ marginBottom: "20px" }}>
                    Please select two different projects to compare.
                </div>
            )}

            {canCompare && (
                <>
                    {/* ── Final Score Comparison ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                        {[
                            { proj: projA, label: "A" },
                            { proj: projB, label: "B" },
                        ].map(({ proj, label }) => (
                            <div key={label} className="card" style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "8px" }}>
                                    PROJECT {label}
                                </div>
                                <div style={{
                                    width: "72px", height: "72px", margin: "0 auto 12px",
                                    borderRadius: "50%",
                                    border: `3px solid ${getScoreColor(proj.finalScore)}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "1.6rem", fontWeight: 800, color: getScoreColor(proj.finalScore),
                                }}>
                                    {proj.finalScore}
                                </div>
                                <div style={{ fontWeight: 700, marginBottom: "4px" }}>{proj.title}</div>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                    {new Date(proj.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Overlay Radar ── */}
                    <div className="card" style={{ marginBottom: "24px" }}>
                        <h3 style={{ marginBottom: "20px" }}>🕸️ Skill Radar Overlay</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                                <PolarRadiusAxis angle={90} domain={[0, 9]} tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                                <Radar name={projA.title.slice(0, 20)} dataKey="A"
                                    stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} strokeWidth={2} />
                                <Radar name={projB.title.slice(0, 20)} dataKey="B"
                                    stroke="var(--success)" fill="var(--success)" fillOpacity={0.15} strokeWidth={2} />
                                <Legend wrapperStyle={{ color: "var(--text-secondary)", fontSize: "0.85rem" }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* ── Dimension Diff Table ── */}
                    <div className="card" style={{ marginBottom: "24px" }}>
                        <h3 style={{ marginBottom: "20px" }}>📊 Dimension Breakdown</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", gap: "10px 16px", alignItems: "center" }}>
                            {/* Header */}
                            <div />
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>DIMENSION</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 600, textAlign: "center" }}>A</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--success)", fontWeight: 600, textAlign: "center" }}>B</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textAlign: "center" }}>DIFF</div>

                            {DIMS.map(({ key, label }) => {
                                const a = projA.evaluation?.[key] ?? 0;
                                const b = projB.evaluation?.[key] ?? 0;
                                const diff = a - b;
                                return (
                                    <>
                                        <div key={key + "_icon"} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)" }} />
                                        <div key={key + "_label"} style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>{label}</div>
                                        <div key={key + "_a"} style={{ fontWeight: 700, color: "var(--accent)", textAlign: "center" }}>{a}</div>
                                        <div key={key + "_b"} style={{ fontWeight: 700, color: "var(--success)", textAlign: "center" }}>{b}</div>
                                        <div key={key + "_diff"} style={{ fontWeight: 700, color: getDiffColor(a, b), textAlign: "center" }}>
                                            {diff > 0 ? `+${diff}` : diff}
                                        </div>
                                    </>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Company Fit Comparison ── */}
                    {(projA.evaluation?.companyFit || projB.evaluation?.companyFit) && (
                        <div className="card">
                            <h3 style={{ marginBottom: "20px" }}>🏢 Company-Fit Comparison</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {[
                                    { key: "google", label: "🔵 Google", color: "#4285F4" },
                                    { key: "startup", label: "🚀 Startup", color: "var(--success)" },
                                    { key: "mnc", label: "🏛️ Enterprise (MNC)", color: "var(--warning)" },
                                ].map(({ key, label, color }) => {
                                    const a = projA.evaluation?.companyFit?.[key] ?? 0;
                                    const b = projB.evaluation?.companyFit?.[key] ?? 0;
                                    return (
                                        <div key={key}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{label}</span>
                                                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                                                    A: <b style={{ color }}>{a}/9</b> · B: <b style={{ color: "var(--success)" }}>{b}/9</b>
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", gap: "4px", height: "6px" }}>
                                                <div style={{
                                                    width: `${(a / 9) * 100}%`, background: color,
                                                    borderRadius: "4px 0 0 4px", opacity: 0.8,
                                                }} />
                                            </div>
                                            <div style={{ display: "flex", gap: "4px", height: "6px", marginTop: "3px" }}>
                                                <div style={{
                                                    width: `${(b / 9) * 100}%`, background: "var(--success)",
                                                    borderRadius: "4px 0 0 4px", opacity: 0.6,
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Compare;
