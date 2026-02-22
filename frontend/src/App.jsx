import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddProject from "./pages/AddProject";
import ProjectDetails from "./pages/ProjectDetails";
import PublicProfile from "./pages/PublicProfile";
import Leaderboard from "./pages/Leaderboard";
import Compare from "./pages/Compare";
import { useAuth } from "./context/AuthContext";

const App = () => {
    const { isAuthenticated } = useAuth();

    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/dashboard" element={
                    <ProtectedRoute><Dashboard /></ProtectedRoute>
                } />
                <Route path="/projects/new" element={
                    <ProtectedRoute><AddProject /></ProtectedRoute>
                } />
                <Route path="/projects/:id" element={
                    <ProtectedRoute><ProjectDetails /></ProtectedRoute>
                } />

                {/* Public developer profile — no auth required */}
                <Route path="/u/:slug" element={<PublicProfile />} />

                {/* Leaderboard — public */}
                <Route path="/leaderboard" element={<Leaderboard />} />

                {/* Compare — protected */}
                <Route path="/compare" element={
                    <ProtectedRoute><Compare /></ProtectedRoute>
                } />

                <Route path="*" element={
                    <div className="page-center">
                        <div style={{ textAlign: "center" }}>
                            <h1 style={{ fontSize: "4rem", color: "var(--accent)" }}>404</h1>
                            <p>Page not found.</p>
                        </div>
                    </div>
                } />
            </Routes>
        </>
    );
};

export default App;
