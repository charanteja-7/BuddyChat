import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  withCredentials: true,
});

// Auth
export const register = (name: string, email: string, password: string) =>
  api.post("/api/auth/register", { name, email, password });

export const login = (email: string, password: string) =>
  api.post("/api/auth/login", { email, password });

export const logout = () => api.post("/api/auth/logout");

export const getMe = () => api.get("/api/auth/me");

// Groups
export const getGroups = () => api.get("/api/groups");

export const createGroup = (name: string) =>
  api.post("/api/groups", { name });

export const joinGroup = (inviteCode: string) =>
  api.post(`/api/groups/join/${inviteCode}`);

export const getGroupById = (id: string) => api.get(`/api/groups/${id}`);

// Messages
export const getMessages = (groupId: string, page = 1, limit = 50) =>
  api.get(`/api/messages/${groupId}`, { params: { page, limit } });

export const sendMessage = (groupId: string, content: string) =>
  api.post(`/api/messages/${groupId}`, { content });

export default api;
