import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, ResponsiveContainer, Tooltip
} from "recharts";
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

const PublicProfile = () => {
    const { slug } = useParams();
    const [profile, setProfile] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get(`/profile/${slug}`);
                setProfile(data.user);
                setProjects(data.projects);
            } catch (err) {
                setError(err.response?.data?.message || "Profile not found.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [slug]);

    if (loading) return <div className="page-center"><span className="spinner" style={{ width: 40, height: 40 }} /></div>;

    if (error) return (
        <div className="page" style={{ textAlign: "center" }}>
            <h2 style={{ color: "var(--danger)" }}>Profile not found</h2>
            <p style={{ marginTop: "8px", color: "var(--text-muted)" }}>This developer profile doesn't exist or is private.</p>
        </div>
    );

    const evaluated = projects.filter((p) => p.status === "evaluated");
    const avgScore = evaluated.length
        ? Math.round(evaluated.reduce((s, p) => s + (p.finalScore || 0), 0) / evaluated.length)
        : 0;
    const topScore = evaluated.length ? Math.max(...evaluated.map((p) => p.finalScore || 0)) : 0;
    const allTags = [...new Set(evaluated.flatMap((p) => p.evaluation?.skillTags || []))].slice(0, 10);

    // Aggregate radar — average across all projects
    const avgRadar = evaluated.length > 0 ? [
        { subject: "Architecture", score: Math.round(evaluated.reduce((s, p) => s + (p.evaluation?.architectureScore || 0), 0) / evaluated.length) },
        { subject: "Code Quality", score: Math.round(evaluated.reduce((s, p) => s + (p.evaluation?.codeQualityScore || 0), 0) / evaluated.length) },
        { subject: "Scalability", score: Math.round(evaluated.reduce((s, p) => s + (p.evaluation?.scalabilityScore || 0), 0) / evaluated.length) },
        { subject: "Innovation", score: Math.round(evaluated.reduce((s, p) => s + (p.evaluation?.innovationScore || 0), 0) / evaluated.length) },
        { subject: "Real Impact", score: Math.round(evaluated.reduce((s, p) => s + (p.evaluation?.realWorldImpactScore || 0), 0) / evaluated.length) },
    ] : [];

    const handleShareLinkedIn = () => {
        const text = `Check out ${profile.name}'s developer profile on SkillProof — AI-evaluated project scores and skill breakdown.`;
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(text)}`;
        window.open(url, "_blank");
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
    };

    return (
        <div className="page" style={{ maxWidth: "820px" }}>
            {/* ── Hero ── */}
            <div className="card" style={{ marginBottom: "24px", display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{
                    width: "72px", height: "72px", borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--accent), var(--success))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.8rem", fontWeight: 800, color: "#fff", flexShrink: 0,
                }}>
                    {profile.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: "1.5rem" }}>{profile.name}</h1>
                    {profile.bio && <p style={{ color: "var(--text-secondary)", marginTop: "6px", lineHeight: 1.6 }}>{profile.bio}</p>}
                    {profile.githubUsername && (
                        <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noopener noreferrer"
                            style={{ color: "var(--accent)", fontSize: "0.85rem", marginTop: "6px", display: "block" }}>
                            github.com/{profile.githubUsername}
                        </a>
                    )}
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                        <button onClick={handleShareLinkedIn} className="btn btn-ghost" style={{ fontSize: "0.8rem", padding: "5px 12px" }}>
                            📤 Share on LinkedIn
                        </button>
                        <button onClick={handleCopyLink} className="btn btn-ghost" style={{ fontSize: "0.8rem", padding: "5px 12px" }}>
                            🔗 Copy Profile Link
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Stats ── */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
                {[
                    { label: "Projects", value: evaluated.length, color: "var(--accent)" },
                    { label: "Avg Score", value: avgScore > 0 ? `${avgScore}/10` : "—", color: "var(--accent)" },
                    { label: "Top Score", value: topScore > 0 ? `${topScore}/10` : "—", color: "var(--success)" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="card" style={{ flex: 1, minWidth: "120px", textAlign: "center" }}>
                        <div style={{ fontSize: "1.7rem", fontWeight: 800, color }}>{value}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* ── Skill Radar ── */}
            {avgRadar.length > 0 && (
                <div className="card" style={{ marginBottom: "24px" }}>
                    <h3 style={{ marginBottom: "20px" }}>🕸️ Skill Radar (Average)</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <RadarChart data={avgRadar}>
                            <PolarGrid stroke="rgba(255,255,255,0.08)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                            <Radar name="Avg Score" dataKey="score"
                                stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.25} strokeWidth={2} />
                            <Tooltip
                                formatter={(val) => [`${val}/10`, "Avg Score"]}
                                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px" }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* ── Skill Tags ── */}
            {allTags.length > 0 && (
                <div className="card" style={{ marginBottom: "24px" }}>
                    <h3 style={{ marginBottom: "14px" }}>🏷️ Tech Skills</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {allTags.map((t) => <span key={t} className="tag tag-accent">{t}</span>)}
                    </div>
                </div>
            )}

            {/* ── Projects ── */}
            {evaluated.length > 0 && (
                <div>
                    <h3 style={{ marginBottom: "16px" }}>📁 Projects</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {evaluated.map((p) => (
                            <div key={p._id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{p.title}</div>
                                    <a href={p.githubUrl} target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: "0.8rem", color: "var(--accent)" }}>{p.githubUrl}</a>
                                    {p.techStack?.length > 0 && (
                                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                                            {p.techStack.map((t) => <span key={t} className="tag" style={{ fontSize: "0.72rem" }}>{t}</span>)}
                                        </div>
                                    )}
                                </div>
                                <div style={{
                                    width: "56px", height: "56px", borderRadius: "50%",
                                    border: `2px solid ${getScoreColor(p.finalScore)}`,
                                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: getScoreColor(p.finalScore) }}>{p.finalScore}</span>
                                    <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>{getScoreLabel(p.finalScore).toUpperCase()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ textAlign: "center", marginTop: "40px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                Powered by <strong style={{ color: "var(--accent)" }}>SkillProof</strong> · AI Developer Intelligence
            </div>
        </div>
    );
};

export default PublicProfile;
