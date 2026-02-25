import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
    headers: { "Content-Type": "application/json" },
});

// Inject auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("skillproof_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => {
        // Backend wraps as { success, data: { ... } }
        // Return the inner data so callers get the useful payload directly
        if (response.data && response.data.success && response.data.data !== undefined) {
            return { data: response.data.data };
        }
        // Non-wrapped responses (shouldn't happen, but safe fallback)
        return { data: response.data };
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("skillproof_token");
            localStorage.removeItem("skillproof_user");
            // Only redirect if not already on login/register
            if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;