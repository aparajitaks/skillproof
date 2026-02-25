import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(form.email, form.password);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-center">
            <div style={{ width: "100%", maxWidth: "420px" }}>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px", fontWeight: 800, color: "var(--accent)" }}>SP</div>
                    <h1 style={{ fontSize: "1.8rem" }}>Welcome back</h1>
                    <p style={{ marginTop: "8px" }}>Sign in to your SkillProof account</p>
                </div>

                <div className="card">
                    {error && <div className="error-box">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="jane@example.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Your password"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Signing in…</> : "Sign In"}
                        </button>
                    </form>

                    <hr className="divider" />
                    <p style={{ textAlign: "center", fontSize: "0.9rem" }}>
                        Don&apos;t have an account?{" "}
                        <Link to="/register" style={{ color: "var(--accent)", fontWeight: 600 }}>Sign up free</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
