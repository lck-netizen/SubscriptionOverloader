const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');

async function getNotifications(userId) {
  const items = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
  const unread = await Notification.countDocuments({ userId, read: false });
  return { notifications: items, unread };
}

async function markAsRead(userId, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  );

  if (!notification) {
    throw new AppError('Not found', 404);
  }

  return notification;
}

async function markAllAsRead(userId) {
  await Notification.updateMany({ userId, read: false }, { read: true });
  return { ok: true };
}

async function deleteNotification(userId, notificationId) {
  const result = await Notification.findOneAndDelete({ _id: notificationId, userId });
  if (!result) {
    throw new AppError('Not found', 404);
  }
  return { ok: true };
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
