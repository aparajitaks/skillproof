/**
 * StatusBadge — displays a colored pill for project evaluation status.
 * Used in ProjectCard and Dashboard project lists.
 */
const STATUS_CONFIG = {
    pending: { label: "Pending", color: "var(--text-muted)", bg: "rgba(255,255,255,0.06)" },
    processing: { label: "Processing", color: "var(--warning)", bg: "rgba(245,158,11,0.1)", pulse: true },
    evaluated: { label: "Evaluated", color: "var(--success)", bg: "rgba(16,185,129,0.1)" },
    failed: { label: "Failed", color: "var(--danger)", bg: "rgba(239,68,68,0.1)" },
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
        <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "0.72rem",
            fontWeight: 600,
            padding: "3px 9px",
            borderRadius: "99px",
            color: cfg.color,
            background: cfg.bg,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
        }}>
            {cfg.pulse && (
                <span style={{
                    width: "6px", height: "6px",
                    borderRadius: "50%",
                    background: cfg.color,
                    animation: "pulse 1.5s ease-in-out infinite",
                }} />
            )}
            {cfg.label}
        </span>
    );
};

export default StatusBadge;
