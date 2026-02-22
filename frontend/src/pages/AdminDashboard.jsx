import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const TABS = ["Overview", "Users", "Projects"];
const COST_PER_1K = 0.00059;
const fmtCost = (tokens) => `$${((tokens / 1000) * COST_PER_1K).toFixed(4)}`;

const StatCard = ({ icon, label, value, sub, color }) => (
    <div className="card" style={{ flex: 1, minWidth: "150px" }}>
        <div style={{ fontSize: "1.6rem", marginBottom: "6px" }}>{icon}</div>
        <div style={{ fontSize: "1.6rem", fontWeight: 800, color: color || "var(--accent)" }}>{value}</div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>{label}</div>
        {sub && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>{sub}</div>}
    </div>
);

const StatusBadge = ({ status }) => {
    const colors = {
        admin: "var(--accent)",
        developer: "var(--success)",
        recruiter: "var(--warning)",
    };
    return (
        <span style={{
            fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "12px",
            background: `${colors[status] || "var(--text-muted)"}22`,
            color: colors[status] || "var(--text-muted)", border: `1px solid ${colors[status] || "var(--border)"}`,
        }}>
            {status}
        </span>
    );
};

const ScoreBadge = ({ score }) => {
    const color = score >= 6 ? "var(--success)" : score >= 3 ? "var(--warning)" : "var(--danger)";
    return (
        <span style={{ fontWeight: 800, color }}>
            {score != null ? `${score}/9` : "—"}
        </span>
    );
};

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState("Overview");
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Redirect non-admins
    useEffect(() => {
        if (user && user.role !== "admin") {
            navigate("/dashboard");
        }
    }, [user, navigate]);

    // Load stats on mount
    useEffect(() => {
        if (!user || user.role !== "admin") return;
        const load = async () => {
            try {
                const [statsRes, usersRes, projectsRes] = await Promise.all([
                    api.get("/admin/stats"),
                    api.get("/admin/users?limit=20"),
                    api.get("/admin/projects?limit=20"),
                ]);
                setStats(statsRes.data.stats);
                setUsers(usersRes.data.users || []);
                setProjects(projectsRes.data.projects || []);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load admin data.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user]);

    if (loading) return <div className="page-center"><span className="spinner" style={{ width: 40, height: 40 }} /></div>;
    if (error) return <div className="page"><div className="error-box">{error}</div></div>;
    if (!stats) return null;

    return (
        <div className="page" style={{ maxWidth: "1000px" }}>
            {/* Header */}
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "1.8rem" }}>🛡️ Admin Dashboard</h1>
                <p style={{ marginTop: "6px", color: "var(--text-secondary)" }}>
                    Platform observability — all data is live from MongoDB.
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                {TABS.map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`btn ${tab === t ? "btn-primary" : "btn-ghost"}`}
                        style={{ fontSize: "0.85rem", padding: "6px 16px" }}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* ── Overview Tab ── */}
            {tab === "Overview" && (
                <>
                    {/* Stat grid */}
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
                        <StatCard icon="👥" label="Total Users" value={stats.totalUsers} />
                        <StatCard icon="📁" label="Total Projects" value={stats.totalProjects} />
                        <StatCard icon="✅" label="Evaluated" value={stats.evaluatedProjects}
                            sub={`${stats.failedProjects} failed`} color="var(--success)" />
                        <StatCard icon="⭐" label="Avg Score" value={`${stats.avgPlatformScore}/9`}
                            color="var(--accent)" />
                        <StatCard icon="🤖" label="Tokens Used"
                            value={stats.totalTokensUsed.toLocaleString()}
                            sub={`Est. $${stats.estimatedCostUsd}`}
                            color="var(--warning)" />
                    </div>

                    {/* Top Tech Stacks */}
                    {stats.topTechStacks?.length > 0 && (
                        <div className="card" style={{ marginBottom: "20px" }}>
                            <h3 style={{ marginBottom: "16px" }}>🔧 Top Tech Stacks</h3>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                {stats.topTechStacks.map(({ name, count }) => (
                                    <div key={name} style={{
                                        display: "flex", alignItems: "center", gap: "8px",
                                        background: "rgba(99,102,241,0.08)", borderRadius: "20px",
                                        padding: "5px 14px", border: "1px solid var(--border)",
                                    }}>
                                        <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{name}</span>
                                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "var(--bg)", borderRadius: "10px", padding: "1px 7px" }}>{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Status breakdown */}
                    <div className="card">
                        <h3 style={{ marginBottom: "16px" }}>📊 Project Status Breakdown</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                            {[
                                { label: "Evaluated", val: stats.evaluatedProjects, color: "var(--success)" },
                                { label: "Processing", val: stats.processingProjects, color: "var(--accent)" },
                                { label: "Pending", val: stats.pendingProjects, color: "var(--warning)" },
                                { label: "Failed", val: stats.failedProjects, color: "var(--danger)" },
                            ].map(({ label, val, color }) => (
                                <div key={label} style={{ textAlign: "center", padding: "12px", background: "var(--bg)", borderRadius: "10px" }}>
                                    <div style={{ fontSize: "1.6rem", fontWeight: 800, color }}>{val}</div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* ── Users Tab ── */}
            {tab === "Users" && (
                <div className="card" style={{ overflowX: "auto" }}>
                    <h3 style={{ marginBottom: "16px" }}>👥 All Users</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                {["Name", "Email", "Role", "Projects", "Top Score", "Tokens", "Est. Cost", "Joined"].map((h) => (
                                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.75rem", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{u.name}</td>
                                    <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: "0.8rem" }}>{u.email}</td>
                                    <td style={{ padding: "10px 12px" }}><StatusBadge status={u.role} /></td>
                                    <td style={{ padding: "10px 12px", textAlign: "center" }}>{u.projectCount}</td>
                                    <td style={{ padding: "10px 12px", textAlign: "center" }}><ScoreBadge score={u.topScore} /></td>
                                    <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-secondary)" }}>{(u.aiTokensUsed || 0).toLocaleString()}</td>
                                    <td style={{ padding: "10px 12px", color: "var(--warning)", fontWeight: 600 }}>{u.estimatedCostUsd}</td>
                                    <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Projects Tab ── */}
            {tab === "Projects" && (
                <div className="card" style={{ overflowX: "auto" }}>
                    <h3 style={{ marginBottom: "16px" }}>📁 All Projects</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                {["Title", "User", "Score", "Status", "Code?", "Prompt", "Submitted"].map((h) => (
                                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.75rem" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((p) => (
                                <tr key={p._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                    <td style={{ padding: "10px 12px", fontWeight: 600, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</td>
                                    <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: "0.8rem" }}>{p.user?.name || "—"}</td>
                                    <td style={{ padding: "10px 12px" }}><ScoreBadge score={p.finalScore} /></td>
                                    <td style={{ padding: "10px 12px" }}>
                                        <span style={{
                                            fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "12px",
                                            color: p.status === "evaluated" ? "var(--success)" : p.status === "failed" ? "var(--danger)" : "var(--warning)",
                                            background: p.status === "evaluated" ? "rgba(16,185,129,0.1)" : p.status === "failed" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                                        }}>{p.status}</span>
                                    </td>
                                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                                        {p.evaluation?.githubAnalyzed ? "🔬" : "—"}
                                    </td>
                                    <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: "0.77rem" }}>{p.evaluation?.promptVersion || "—"}</td>
                                    <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                                        {new Date(p.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
