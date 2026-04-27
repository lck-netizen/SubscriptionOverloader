import api from "@/lib/api";

export const subscriptions = {
  getAll: (params) => api.get("/subscriptions", { params }),
  getMeta: () => api.get("/subscriptions/meta"),
  create: (data) => api.post("/subscriptions", data),
  update: (id, data) => api.put(`/subscriptions/${id}`, data),
  delete: (id) => api.delete(`/subscriptions/${id}`),
  simulatePayment: (id, payload) => api.post(`/subscriptions/${id}/simulate-payment`, payload),
};
