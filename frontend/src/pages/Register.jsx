import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { AnimatedBackground, GlassCard, FloatingInput, GradientButton } from "../components/ui";
import { User, Mail, Lock, Zap, Sparkles } from "lucide-react";

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
            await register(form.name, form.email, form.password);
            navigate("/dashboard");
        } catch (err) {
            if (err.response?.status === 409) {
                setError("Email already registered. Please login instead.");
            } else {
                setError(
                    err.response?.data?.error?.message ||
                    err.response?.data?.message ||
                    err.message ||
                    "Registration failed. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AnimatedBackground />
            <div className="page-center">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="w-full max-w-md"
                >
                    {/* Header */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="text-center mb-8"
                    >
                        <motion.div 
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                        >
                            <Sparkles className="w-8 h-8 text-purple-400" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
                        <p className="text-secondary">Start proving your skills today</p>
                    </motion.div>

                    {/* Card */}
                    <GlassCard className="p-8" hover={false}>
                        {/* Error Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: "auto" }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                    className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30"
                                >
                                    <p className="text-red-400 text-sm flex items-center gap-2">
                                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        {error}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <FloatingInput
                                label="Full Name"
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                icon={User}
                                required
                            />

                            <FloatingInput
                                label="Email address"
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                icon={Mail}
                                required
                            />

                            <FloatingInput
                                label="Password"
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                icon={Lock}
                                required
                            />

                            <GradientButton
                                type="submit"
                                loading={loading}
                                disabled={loading}
                                className="w-full mt-6"
                                size="lg"
                                variant="primary"
                            >
                                <Zap className="w-4 h-4" />
                                Create Account
                            </GradientButton>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-surface/60 text-muted">or continue with</span>
                            </div>
                        </div>

                        {/* Login Link */}
                        <p className="text-center text-secondary text-sm">
                            Already have an account?{" "}
                            <Link 
                                to="/login" 
                                className="text-primary hover:text-purple-400 font-semibold transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </GlassCard>

                    {/* Footer */}
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-center text-muted text-xs mt-8"
                    >
                        By creating an account, you agree to our Terms of Service and Privacy Policy
                    </motion.p>
                </motion.div>
            </div>
        </>
    );
};

export default Register;
