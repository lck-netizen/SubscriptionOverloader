const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.put('/', async (req, res) => {
  try {
    const { name, profilePicture, monthlyBudget, email } = req.body || {};
    if (name != null) req.user.name = String(name).trim();
    if (profilePicture != null) req.user.profilePicture = profilePicture;
    if (monthlyBudget != null) req.user.monthlyBudget = Number(monthlyBudget);
    if (email && email.toLowerCase().trim() !== req.user.email) {
      const lower = email.toLowerCase().trim();
      const exists = await User.findOne({ email: lower });
      if (exists) return res.status(409).json({ detail: 'Email already in use' });
      req.user.email = lower;
      req.user.isVerified = false;
    }
    await req.user.save();
    res.json({ user: req.user.toPublicJSON() });
  } catch (err) {
    console.error('[profile:update]', err);
    res.status(500).json({ detail: 'Could not update profile' });
  }
});

router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ detail: 'Both fields required' });
    if (newPassword.length < 6) return res.status(400).json({ detail: 'Password too short' });
    const ok = await bcrypt.compare(currentPassword, req.user.password);
    if (!ok) return res.status(401).json({ detail: 'Current password is incorrect' });
    req.user.password = await bcrypt.hash(newPassword, 10);
    await req.user.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('[profile:password]', err);
    res.status(500).json({ detail: 'Could not change password' });
  }
});

module.exports = router;
