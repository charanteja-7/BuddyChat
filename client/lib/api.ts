import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => {
    if (response.data?.token) {
      if (typeof window !== "undefined") localStorage.setItem("token", response.data.token);
    }
    return response;
  },
  (error) => Promise.reject(error)
);

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (name: string, email: string, password: string) =>
  api.post("/api/auth/register", { name, email, password });

export const login = (email: string, password: string) =>
  api.post("/api/auth/login", { email, password });

export const logout = () => {
  if (typeof window !== "undefined") localStorage.removeItem("token");
  return api.post("/api/auth/logout");
};

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

export const uploadMedia = (file: File) => {
  const formData = new FormData();
  formData.append("media", file);
  return api.post("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export default api;
