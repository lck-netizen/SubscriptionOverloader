const profileService = require('../services/profileService');

function sendSuccess(res, status, payload, message = null) {
  const response = {
    success: true,
    data: payload,
  };
  if (message !== null) {
    response.message = message;
  }
  res.status(status).json({ ...response, ...payload });
}

async function uploadProfilePicture(req, res) {
  const user = await profileService.uploadProfilePicture(req.user, req.file);
  const payload = { user: user.toPublicJSON(req) };
  sendSuccess(res, 200, payload);
}

async function deleteProfilePicture(req, res) {
  const result = await profileService.deleteProfilePicture(req.user);
  const payload = result; // { ok: true }
  sendSuccess(res, 200, payload);
}

async function updateProfile(req, res) {
  const user = await profileService.updateProfile(req.user, req.body);
  const payload = { user: user.toPublicJSON(req) };
  sendSuccess(res, 200, payload);
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const result = await profileService.changePassword(req.user, currentPassword, newPassword);
  const payload = result; // { ok: true }
  sendSuccess(res, 200, payload);
}

module.exports = {
  uploadProfilePicture,
  deleteProfilePicture,
  updateProfile,
  changePassword,
};
