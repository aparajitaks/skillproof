import { Link } from "react-router-dom";

const getScoreColor = (score) => {
    if (score >= 7) return "var(--success)";
    if (score >= 4) return "var(--warning)";
    return "var(--danger)";
};

const statusLabel = { evaluated: "Evaluated", pending: "Pending", failed: "Failed" };
const statusClass = { evaluated: "status-evaluated", pending: "status-pending", failed: "status-failed" };

const ProjectCard = ({ project }) => {
    const { _id, title, githubUrl, techStack, finalScore, status, evaluation, createdAt } = project;

    return (
        <Link to={`/projects/${_id}`} style={cardLinkStyle}>
            <div style={cardStyle} className="card">
                <div style={headerRow}>
                    <h3 style={{ color: "var(--text-primary)", fontSize: "1rem" }}>{title}</h3>
                    {finalScore !== null && status === "evaluated" && (
                        <div style={{ ...scorePill, borderColor: getScoreColor(finalScore), color: getScoreColor(finalScore) }}>
                            {finalScore}
                        </div>
                    )}
                </div>

                <p style={{ fontSize: "0.8rem", marginTop: "4px", marginBottom: "12px" }}>
                    <span className={statusClass[status]}>● {statusLabel[status]}</span>
                    <span style={{ color: "var(--text-muted)", marginLeft: "12px" }}>
                        {new Date(createdAt).toLocaleDateString()}
                    </span>
                </p>

                {techStack?.length > 0 && (
                    <div style={tagsWrap}>
                        {techStack.slice(0, 4).map((t) => (
                            <span key={t} className="tag">{t}</span>
                        ))}
                        {techStack.length > 4 && <span className="tag">+{techStack.length - 4}</span>}
                    </div>
                )}

                {evaluation?.skillTags?.length > 0 && (
                    <div style={{ ...tagsWrap, marginTop: "8px" }}>
                        {evaluation.skillTags.slice(0, 3).map((t) => (
                            <span key={t} className="tag tag-accent">{t}</span>
                        ))}
                    </div>
                )}

                <p style={{ fontSize: "0.8rem", color: "var(--accent)", marginTop: "16px", fontWeight: 600 }}>
                    View evaluation →
                </p>
            </div>
        </Link>
    );
};

const cardLinkStyle = { textDecoration: "none", display: "block" };
const cardStyle = { cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", ":hover": { transform: "translateY(-2px)" } };
const headerRow = { display: "flex", justifyContent: "space-between", alignItems: "flex-start" };
const tagsWrap = { display: "flex", flexWrap: "wrap", gap: "6px" };
const scorePill = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    fontWeight: 800,
    fontSize: "1rem",
    border: "2px solid",
    background: "rgba(99,102,241,0.1)",
    flexShrink: 0,
};

export default ProjectCard;
