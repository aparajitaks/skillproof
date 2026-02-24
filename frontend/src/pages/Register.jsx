import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const API_URL = import.meta.env.VITE_API_URL || "";
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await response.json();

            if (response.status === 409) {
                setError("User already exists. Please login instead.");
                return;
            }

            if (!response.ok) {
                setError(data.message || "Registration failed. Please try again.");
                return;
            }

            // Success case - the backend response already includes token and user in data.data
            // We use the register function from context to handle the persistence/state
            // But since we want the specific fetch-based error handling requested, 
            // we'll just navigate to login if successful, or use the context method if it's simpler.
            // To match the requested logic exactly:
            setError("");
            navigate("/login");
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-center">
            <div style={{ width: "100%", maxWidth: "420px" }}>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⚡</div>
                    <h1 style={{ fontSize: "1.8rem" }}>Create your account</h1>
                    <p style={{ marginTop: "8px" }}>Start proving your skills today</p>
                </div>

                <div className="card">
                    {error && <div className="error-box">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Jane Doe"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

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
                                placeholder="Min. 6 characters"
                                value={form.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Creating account…</> : "Create Account"}
                        </button>
                    </form>

                    <hr className="divider" />
                    <p style={{ textAlign: "center", fontSize: "0.9rem" }}>
                        Already have an account?{" "}
                        <Link to="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
