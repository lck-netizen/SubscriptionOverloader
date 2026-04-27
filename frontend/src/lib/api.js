import axios from "axios";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");
export const API = BACKEND_URL ? `${BACKEND_URL.replace(/\/$/, "")}/api` : "/api";

const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Attach token from localStorage as fallback (for cross-site cookies that may be blocked)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("som_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function formatErr(err) {
  const d = err?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg || JSON.stringify(x)).join(", ");
  return err?.message || "Something went wrong";
}

export default api;
