import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProjectCard from "../components/ProjectCard";
import api from "../api/axios";

const Dashboard = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data } = await api.get("/projects");
                setProjects(data.projects);
            } catch (err) {
                setError("Failed to load projects.");
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    return (
        <div className="page">
            <div style={headerRow}>
                <div>
                    <h1>Your Projects</h1>
                    <p style={{ marginTop: "6px" }}>AI-evaluated skill proof for every project you ship.</p>
                </div>
                <Link to="/projects/new" className="btn btn-primary">
                    + Add Project
                </Link>
            </div>

            <hr className="divider" />

            {loading && (
                <div style={{ textAlign: "center", padding: "64px" }}>
                    <span className="spinner" style={{ width: 36, height: 36 }} />
                </div>
            )}

            {error && <div className="error-box">{error}</div>}

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

            {!loading && projects.length > 0 && (
                <div className="grid-cards">
                    {projects.map((p) => (
                        <ProjectCard key={p._id} project={p} />
                    ))}
                </div>
            )}
        </div>
    );
};

const headerRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
};

export default Dashboard;
