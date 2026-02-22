import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav style={styles.nav}>
            <div style={styles.inner}>
                <Link to="/" style={styles.logo}>
                    <span style={styles.logoIcon}>⚡</span>
                    <span>SkillProof</span>
                </Link>

                <div style={styles.actions}>
                    {user ? (
                        <>
                            <span style={styles.greeting}>Hey, {user.name.split(" ")[0]}</span>
                            <Link to="/dashboard" className="btn btn-ghost" style={{ padding: "8px 16px" }}>
                                Dashboard
                            </Link>
                            <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: "8px 16px" }}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost" style={{ padding: "8px 16px" }}>Login</Link>
                            <Link to="/register" className="btn btn-primary" style={{ padding: "8px 16px" }}>Get Started</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

const styles = {
    nav: {
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(10,14,26,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        height: "64px",
    },
    inner: {
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "0 24px",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    logo: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        textDecoration: "none",
        color: "var(--text-primary)",
        fontWeight: 800,
        fontSize: "1.1rem",
        letterSpacing: "-0.02em",
    },
    logoIcon: { fontSize: "1.3rem" },
    actions: { display: "flex", alignItems: "center", gap: "12px" },
    greeting: { color: "var(--text-secondary)", fontSize: "0.9rem" },
};

export default Navbar;
