const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { sendTestEmail } = require('../utils/email');
const Notification = require('../models/Notification');

const router = express.Router();
router.use(requireAuth);

router.post('/test', async (req, res) => {
  try {
    const target = (req.body?.email && String(req.body.email).trim()) || req.user.email;
    const result = await sendTestEmail(target, req.user.name);
    if (result?.error) {
      console.error('[email:test] resend error', result.error);
      return res.status(502).json({ detail: result.error.message || 'Email service rejected the request' });
    }
    await Notification.create({
      userId: req.user._id,
      title: 'Test email sent',
      message: `Instant test email dispatched to ${target}.`,
      type: 'email',
    });
    res.json({ ok: true, to: target, id: result?.data?.id || null });
  } catch (err) {
    console.error('[email:test] error', err);
    res.status(500).json({ detail: err?.message || 'Could not send test email' });
  }
});

module.exports = router;
