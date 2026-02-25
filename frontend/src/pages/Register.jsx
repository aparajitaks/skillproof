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
            {/* Animated gradient background - positioned fixed behind everything */}
            <AnimatedBackground />
            
            {/* 
              Main container: 
              - min-h-screen ensures full viewport height
              - flex with items-center + justify-center for TRUE centering
              - px-4 sm:px-6 for consistent horizontal padding
              - py-12 for vertical breathing room (accounts for navbar)
            */}
            <main className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-12">
                
                {/* 
                  Content wrapper:
                  - w-full ensures it fills available space on mobile
                  - max-w-md caps width at 28rem (448px) for optimal form readability
                  - mx-auto is redundant with flex centering but ensures fallback
                */}
                <motion.div 
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="w-full max-w-md"
                >
                    {/* 
                      Header section:
                      - text-center for alignment
                      - mb-8 creates consistent gap before card (32px)
                    */}
                    <motion.header 
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="text-center mb-8"
                    >
                        {/* Icon badge */}
                        <motion.div 
                            whileHover={{ scale: 1.05, rotate: -3 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center justify-center w-16 h-16 mb-5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 backdrop-blur-sm"
                        >
                            <Sparkles className="w-8 h-8 text-purple-400" />
                        </motion.div>
                        
                        {/* Heading - text-3xl on mobile, text-4xl on larger screens */}
                        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
                            Create your account
                        </h1>
                        
                        {/* Subtitle - muted color for visual hierarchy */}
                        <p className="text-gray-400 text-base">
                            Start proving your skills today
                        </p>
                    </motion.header>

                    {/* 
                      Form Card:
                      - p-8 sm:p-10 for comfortable inner spacing
                      - GlassCard already has rounded-2xl, backdrop-blur, border, shadow
                    */}
                    <GlassCard className="p-8 sm:p-10" hover={false}>
                        {/* Error Message - with smooth enter/exit animations */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
                                    animate={{ opacity: 1, y: 0, height: "auto", marginBottom: 24 }}
                                    exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/30"
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

                        {/* Form - space-y-5 for consistent 20px gaps between inputs */}
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

                            {/* Submit button - pt-2 adds slight extra space above button */}
                            <div className="pt-2">
                                <GradientButton
                                    type="submit"
                                    loading={loading}
                                    disabled={loading}
                                    className="w-full"
                                    size="lg"
                                    variant="primary"
                                >
                                    <Zap className="w-4 h-4" />
                                    Create Account
                                </GradientButton>
                            </div>
                        </form>

                        {/* Divider - my-8 for equal 32px spacing above and below */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-4 bg-[#111827]/80 text-gray-500 text-sm">
                                    or continue with
                                </span>
                            </div>
                        </div>

                        {/* Login Link */}
                        <p className="text-center text-gray-400 text-sm">
                            Already have an account?{" "}
                            <Link 
                                to="/login" 
                                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </GlassCard>

                    {/* 
                      Footer text:
                      - mt-8 creates consistent gap after card (32px)
                      - Matches mb-8 above card for visual symmetry
                    */}
                    <motion.footer 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                        className="text-center mt-8"
                    >
                        <p className="text-gray-500 text-xs leading-relaxed">
                            By creating an account, you agree to our{" "}
                            <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                Terms of Service
                            </a>{" "}
                            and{" "}
                            <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                Privacy Policy
                            </a>
                        </p>
                    </motion.footer>
                </motion.div>
            </main>
        </>
    );
};

export default Register;
