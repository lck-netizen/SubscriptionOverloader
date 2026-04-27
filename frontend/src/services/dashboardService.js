import api from "@/lib/api";

export const dashboard = {
  getStats: () => api.get("/dashboard/stats"),
};
