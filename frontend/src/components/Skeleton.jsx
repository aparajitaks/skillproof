import React from "react";

const Skeleton = ({ width = "100%", height = "20px", borderRadius = "4px", style = {} }) => {
    return (
        <div
            style={{
                width,
                height,
                borderRadius,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                backgroundImage: "linear-gradient(90deg, rgba(255, 255, 255, 0) 0, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0) 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite linear",
                ...style,
            }}
        />
    );
};

export default Skeleton;
