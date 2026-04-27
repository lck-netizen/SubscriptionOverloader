import api from "@/lib/api";

export const auth = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  verifyEmail: (token) => api.get("/auth/verify-email", { params: { token } }),
  resendVerification: () => api.post("/auth/resend-verification"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) => api.post("/auth/reset-password", { token, password }),
};
