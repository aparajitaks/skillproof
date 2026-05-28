import api from "./axios";

export const getProjects = (params = {}) =>
    api.get("/api/projects", { params });

export const getProjectById = (id) =>
    api.get(`/api/projects/${id}`);

export const createProject = (data) =>
    api.post("/api/projects", data);
