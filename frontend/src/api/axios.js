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
        if (response.data && response.data.success && response.data.data) {
            return response.data;
        }
        return response.data;
    },
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