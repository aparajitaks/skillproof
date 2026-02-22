import api from "./axios";

export const getProjects = (params = {}) =>
    api.get("/projects", { params });

export const getProjectById = (id) =>
    api.get(`/projects/${id}`);

export const createProject = (data) =>
    api.post("/projects", data);
