import api from "@/lib/api";

export const profile = {
  update: (data) => api.put("/profile", data),
  updatePassword: (currentPassword, newPassword) =>
    api.put("/profile/password", { currentPassword, newPassword }),
  uploadPicture: (file) => {
    const formData = new FormData();
    formData.append("profilePicture", file);
    return api.post("/profile/profile-picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deletePicture: () => api.delete("/profile/profile-picture"),
};
