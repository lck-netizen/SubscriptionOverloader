const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { signAccessToken, setAuthCookie, clearAuthCookie, requireAuth } = require('../middleware/auth');
const { sendVerificationEmail, sendResetEmail } = require('../utils/email');

const router = express.Router();

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

function newToken() {
  return crypto.randomBytes(32).toString('hex');
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ detail: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ detail: 'Password must be at least 6 characters' });
    }
    const lower = email.toLowerCase().trim();
    const existing = await User.findOne({ email: lower });
    if (existing) return res.status(409).json({ detail: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const verificationToken = newToken();
    const user = await User.create({
      name: name.trim(),
      email: lower,
      password: hash,
      verificationToken,
      verificationExpires: new Date(Date.now() + VERIFY_TTL_MS),
    });

    sendVerificationEmail(user.email, verificationToken).catch((err) => {
      console.error('[register] verification email failed:', err?.message || err);
    });

    const token = signAccessToken(user);
    setAuthCookie(res, token);
    res.status(201).json({ user: user.toPublicJSON(), token });
  } catch (err) {
    console.error('[register] error', err);
    res.status(500).json({ detail: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ detail: 'Email and password are required' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ detail: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ detail: 'Invalid credentials' });

    const token = signAccessToken(user);
    setAuthCookie(res, token);
    res.json({ user: user.toPublicJSON(), token });
  } catch (err) {
    console.error('[login] error', err);
    res.status(500).json({ detail: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
});

router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ detail: 'Token missing' });
    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ detail: 'Invalid or expired verification token' });
    if (user.verificationExpires && user.verificationExpires.getTime() < Date.now()) {
      return res.status(400).json({ detail: 'Verification token expired' });
    }
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    await user.save();
    res.json({ ok: true, user: user.toPublicJSON() });
  } catch (err) {
    console.error('[verify-email] error', err);
    res.status(500).json({ detail: 'Verification failed' });
  }
});

router.post('/resend-verification', requireAuth, async (req, res) => {
  try {
    if (req.user.isVerified) return res.json({ ok: true, message: 'Already verified' });
    const token = newToken();
    req.user.verificationToken = token;
    req.user.verificationExpires = new Date(Date.now() + VERIFY_TTL_MS);
    await req.user.save();
    await sendVerificationEmail(req.user.email, token);
    res.json({ ok: true });
  } catch (err) {
    console.error('[resend-verification] error', err);
    res.status(500).json({ detail: 'Could not resend verification' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ detail: 'Email required' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always respond ok to avoid user enumeration
    if (user) {
      const token = newToken();
      user.resetToken = token;
      user.resetExpires = new Date(Date.now() + RESET_TTL_MS);
      await user.save();
      sendResetEmail(user.email, token).catch((err) =>
        console.error('[forgot-password] email failed', err?.message || err)
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[forgot-password] error', err);
    res.status(500).json({ detail: 'Could not process request' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ detail: 'Token and password required' });
    if (password.length < 6) return res.status(400).json({ detail: 'Password must be at least 6 characters' });
    const user = await User.findOne({ resetToken: token });
    if (!user || !user.resetExpires || user.resetExpires.getTime() < Date.now()) {
      return res.status(400).json({ detail: 'Invalid or expired reset token' });
    }
    user.password = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetExpires = null;
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('[reset-password] error', err);
    res.status(500).json({ detail: 'Reset failed' });
  }
});

module.exports = router;
