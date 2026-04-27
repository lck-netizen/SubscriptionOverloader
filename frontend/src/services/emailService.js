import api from "@/lib/api";

export const email = {
  sendTest: () => api.post("/email/test"),
};
