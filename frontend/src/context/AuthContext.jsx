import { createContext, useContext, useState, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

const TOKEN_KEY = "skillproof_token";
const USER_KEY = "skillproof_user";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem(USER_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    // Helper: store token + user object from API response
    // API now returns { success, token, user: { id, name, email, ... } }
    const _persist = (data) => {
        const token = data.token;
        const userObj = data.user || data; // fallback for old shape
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(userObj));
        setUser(userObj);
        return userObj;
    };

    const login = useCallback(async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        return _persist(data);
    }, []);

    const register = useCallback(async (name, email, password) => {
        const { data } = await api.post("/auth/register", { name, email, password });
        return _persist(data);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
