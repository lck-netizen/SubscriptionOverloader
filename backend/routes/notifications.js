const express = require('express');
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const items = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
  const unread = await Notification.countDocuments({ userId: req.user._id, read: false });
  res.json({ notifications: items, unread });
});

router.put('/:id/read', async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { read: true },
    { new: true }
  );
  if (!n) return res.status(404).json({ detail: 'Not found' });
  res.json({ notification: n });
});

router.put('/read-all', async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  const result = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!result) return res.status(404).json({ detail: 'Not found' });
  res.json({ ok: true });
});

module.exports = router;
