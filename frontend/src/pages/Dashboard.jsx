import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProjectCard from "../components/ProjectCard";
import { SkeletonGrid } from "../components/SkeletonCard";
import { getProjects } from "../api/projects";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from "recharts";
import { Helmet } from "react-helmet-async";

const StatCard = ({ label, value, sub, color, trend }) => (
    <div className="card" style={{ flex: 1, minWidth: "140px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: color || "var(--accent)" }}>{value}</div>
            {trend && (
                <span style={{
                    fontSize: "0.8rem", fontWeight: 700,
                    color: trend > 0 ? "var(--success)" : trend < 0 ? "var(--danger)" : "var(--text-muted)"
                }}>
                    {trend > 0 ? `↑${trend}` : trend < 0 ? `↓${Math.abs(trend)}` : "→"}
                </span>
            )}
        </div>
        <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "4px" }}>{label}</div>
        {sub && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>{sub}</div>}
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data } = await getProjects({ limit: 20 });
                setProjects(data.projects || []);
            } catch {
                setError("Failed to load projects. Please refresh.");
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const evaluated = projects.filter((p) => p.status === "evaluated");
    const avgScore = evaluated.length
        ? Math.round(evaluated.reduce((s, p) => s + (p.finalScore || 0), 0) / evaluated.length)
        : 0;
    const topScore = evaluated.length ? Math.max(...evaluated.map((p) => p.finalScore || 0)) : 0;

    // Score trend: compare last score vs second-to-last
    const sortedByDate = [...evaluated].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const scoreTrend = sortedByDate.length >= 2
        ? (sortedByDate[0].finalScore || 0) - (sortedByDate[1].finalScore || 0)
        : null;

    // Chart: last 10 evaluated sorted oldest → newest
    const chartData = [...evaluated]
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(-10)
        .map((p, i) => ({
            name: `#${i + 1}`,
            score: p.finalScore,
            title: p.title,
        }));

    const allTags = [...new Set(evaluated.flatMap((p) => p.evaluation?.skillTags || []))].slice(0, 8);

    return (
        <div className="page">
            <Helmet>
                <title>Dashboard | SkillProof</title>
                <meta name="description" content="SkillProof dashboard and project evaluations." />
            </Helmet>
            {/* ── Header ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <h1>Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
                    <p style={{ marginTop: "6px", color: "var(--text-secondary)" }}>
                        AI-powered skill evaluation for every project you ship.
                    </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Link to="/compare" className="btn btn-ghost">⚖️ Compare</Link>
                    <Link to="/projects/new" className="btn btn-primary">+ Add Project</Link>
                </div>
            </div>

            <hr className="divider" />

            {/* ── Skeleton loading ── */}
            {loading && <SkeletonGrid count={4} />}

            {error && <div className="error-box">{error}</div>}

            {/* ── Stats Row ── */}
            {!loading && !error && projects.length > 0 && (
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "28px" }}>
                    <StatCard label="Projects" value={projects.length} sub="total submitted" />
                    <StatCard
                        label="Top Score" value={topScore > 0 ? `${topScore}/9` : "—"}
                        sub="best project" color="var(--success)"
                    />
                    <StatCard
                        label="Avg Score" value={avgScore > 0 ? `${avgScore}/9` : "—"}
                        sub="across evaluated" color="var(--accent)"
                        trend={scoreTrend}
                    />
                    <StatCard label="Evaluated" value={evaluated.length} sub={`${projects.length - evaluated.length} pending`} />
                </div>
            )}

            {/* ── Score History Chart ── */}
            {chartData.length >= 2 && (
                <div className="card" style={{ marginBottom: "28px" }}>
                    <h3 style={{ marginBottom: "20px" }}>📈 Score History</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 9]} tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                formatter={(val, _, props) => [`${val}/9 — ${props.payload.title}`, "Score"]}
                                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px" }}
                                labelStyle={{ color: "var(--text-muted)" }}
                            />
                            <Line
                                type="monotone" dataKey="score"
                                stroke="var(--accent)" strokeWidth={2.5}
                                dot={{ fill: "var(--accent)", r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* ── Skill Tag Cloud ── */}
            {allTags.length > 0 && (
                <div className="card" style={{ marginBottom: "28px" }}>
                    <h3 style={{ marginBottom: "14px" }}>🏷️ Your Skill Profile</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {allTags.map((t) => <span key={t} className="tag tag-accent">{t}</span>)}
                    </div>
                </div>
            )}

            {/* ── Empty state ── */}
            {!loading && !error && projects.length === 0 && (
                <div className="empty-state">
                    <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🚀</div>
                    <h3>No projects yet</h3>
                    <p>Submit your first project and get an instant AI evaluation.</p>
                    <Link to="/projects/new" className="btn btn-primary" style={{ marginTop: "24px" }}>
                        Submit Your First Project
                    </Link>
                </div>
            )}

            {/* ── Project list ── */}
            {!loading && !error && projects.length > 0 && (
                <>
                    <h2 style={{ marginBottom: "20px" }}>Your Projects</h2>
                    <div className="grid-cards">
                        {projects.map((p) => <ProjectCard key={p._id} project={p} />)}
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
