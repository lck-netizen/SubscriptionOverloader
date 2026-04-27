const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(getNotifications));
router.put('/:id/read', asyncHandler(markAsRead));
router.put('/read-all', asyncHandler(markAllAsRead));
router.delete('/:id', asyncHandler(deleteNotification));

module.exports = router;
