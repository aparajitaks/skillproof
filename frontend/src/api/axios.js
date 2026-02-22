import axios from "axios";

const api = axios.create({
    baseURL: "/api",
    headers: { "Content-Type": "application/json" },
});

// Inject auth token on every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("skillproof_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Global 401 handler — clear stale tokens
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("skillproof_token");
            localStorage.removeItem("skillproof_user");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default api;
