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

    // Helper: store token + user from API response
    // After interceptor unwrap, data = { success, token, user }
    const _persist = (payload) => {
        const token = payload.token;
        const userObj = payload.user;
        if (!token || !userObj) {
            throw new Error("Invalid auth response from server");
        }
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
