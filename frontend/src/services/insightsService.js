import api from "@/lib/api";

export const insights = {
  generate: () => api.get("/insights"),
};
