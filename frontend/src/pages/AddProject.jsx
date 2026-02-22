import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

const AddProject = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: "",
        githubUrl: "",
        description: "",
        techStack: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const payload = {
            title: form.title,
            githubUrl: form.githubUrl,
            description: form.description,
            techStack: form.techStack
                ? form.techStack.split(",").map((t) => t.trim()).filter(Boolean)
                : [],
        };

        try {
            const { data } = await api.post("/projects", payload);
            // Backend returns { success, project } — extract the nested id
            const projectId = data.project?._id ?? data._id;
            navigate(`/projects/${projectId}`);
        } catch (err) {
            const msg = err.response?.data?.errors?.[0]?.msg
                || err.response?.data?.message
                || "Submission failed. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page" style={{ maxWidth: "680px" }}>
            <Link to="/dashboard" style={{ color: "var(--text-muted)", fontSize: "0.9rem", textDecoration: "none" }}>
                ← Back to Dashboard
            </Link>

            <div style={{ marginTop: "24px", marginBottom: "32px" }}>
                <h1>Submit a Project</h1>
                <p style={{ marginTop: "6px" }}>Our AI will evaluate your project and generate a skill score in seconds.</p>
            </div>

            <div className="card">
                {loading && (
                    <div style={loadingOverlay}>
                        <div style={{ textAlign: "center" }}>
                            <span className="spinner" style={{ width: 40, height: 40 }} />
                            <p style={{ marginTop: "16px", color: "var(--text-secondary)" }}>
                                AI is evaluating your project…
                            </p>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                                This may take up to 30 seconds
                            </p>
                        </div>
                    </div>
                )}

                {error && <div className="error-box">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">Project Title *</label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            placeholder="My Awesome SaaS App"
                            value={form.title}
                            onChange={handleChange}
                            required
                            maxLength={120}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="githubUrl">GitHub Repository URL *</label>
                        <input
                            id="githubUrl"
                            name="githubUrl"
                            type="url"
                            placeholder="https://github.com/username/repository"
                            value={form.githubUrl}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Project Description * (min. 20 characters)</label>
                        <textarea
                            id="description"
                            name="description"
                            placeholder="Describe what your project does, the architecture decisions you made, and the technical challenges you solved…"
                            value={form.description}
                            onChange={handleChange}
                            required
                            minLength={20}
                            style={{ minHeight: "120px" }}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="techStack">Tech Stack (comma-separated)</label>
                        <input
                            id="techStack"
                            name="techStack"
                            type="text"
                            placeholder="Node.js, React, MongoDB, Redis"
                            value={form.techStack}
                            onChange={handleChange}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: "8px" }}>
                        {loading ? "Evaluating…" : "Submit for AI Evaluation"}
                    </button>
                </form>
            </div>
        </div>
    );
};

const loadingOverlay = {
    position: "absolute",
    inset: 0,
    background: "rgba(10,14,26,0.85)",
    backdropFilter: "blur(8px)",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
};

export default AddProject;
