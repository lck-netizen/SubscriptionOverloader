const notificationService = require('../services/notificationService');

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

async function getNotifications(req, res) {
  const result = await notificationService.getNotifications(req.user._id);
  const payload = result; // { notifications, unread }
  sendSuccess(res, 200, payload);
}

async function markAsRead(req, res) {
  const notification = await notificationService.markAsRead(req.user._id, req.params.id);
  const payload = { notification };
  sendSuccess(res, 200, payload);
}

async function markAllAsRead(req, res) {
  const result = await notificationService.markAllAsRead(req.user._id);
  const payload = result; // { ok: true }
  sendSuccess(res, 200, payload);
}

async function deleteNotification(req, res) {
  const result = await notificationService.deleteNotification(req.user._id, req.params.id);
  const payload = result; // { ok: true }
  sendSuccess(res, 200, payload);
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
