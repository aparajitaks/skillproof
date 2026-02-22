/**
 * SkeletonCard — animated loading placeholder for project cards.
 * Mimics the shape of a ProjectCard while data loads.
 */
const shimmer = {
    background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.6s ease-in-out infinite",
    borderRadius: "6px",
};

const Bar = ({ width = "100%", height = "12px", style = {} }) => (
    <div style={{ ...shimmer, width, height, ...style }} />
);

const SkeletonCard = () => (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Bar width="60%" height="16px" />
            <Bar width="20%" height="22px" style={{ borderRadius: "99px" }} />
        </div>
        <Bar width="85%" height="12px" />
        <Bar width="70%" height="12px" />
        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <Bar width="60px" height="20px" style={{ borderRadius: "99px" }} />
            <Bar width="60px" height="20px" style={{ borderRadius: "99px" }} />
            <Bar width="60px" height="20px" style={{ borderRadius: "99px" }} />
        </div>
    </div>
);

export const SkeletonGrid = ({ count = 4 }) => (
    <div className="grid-cards">
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} />
        ))}
    </div>
);

export default SkeletonCard;
