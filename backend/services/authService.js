const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { sendVerificationEmail, sendResetEmail } = require('../utils/email');
const { AppError } = require('../middleware/errorHandler');

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function registerUser({ name, email, password }) {
  try {
    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required', 400);
    }
    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    const lower = email.toLowerCase().trim();
    const existing = await User.findOne({ email: lower });
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const hash = await bcrypt.hash(password, 10);
    const verificationToken = generateToken();

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

    return user;
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[register] error', err);
    throw new AppError('Registration failed', 500);
  }
}

async function loginUser({ email, password }) {
  try {
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw new AppError('Invalid credentials', 401);
    }

    return user;
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[login] error', err);
    throw new AppError('Login failed', 500);
  }
}

async function verifyEmail(token) {
  try {
    if (!token) {
      throw new AppError('Token missing', 400);
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    if (user.verificationExpires && user.verificationExpires.getTime() < Date.now()) {
      throw new AppError('Verification token expired', 400);
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    await user.save();

    return user;
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[verify-email] error', err);
    throw new AppError('Verification failed', 500);
  }
}

async function resendVerification(user) {
  try {
    if (user.isVerified) {
      return { alreadyVerified: true };
    }

    const token = generateToken();
    user.verificationToken = token;
    user.verificationExpires = new Date(Date.now() + VERIFY_TTL_MS);
    await user.save();

    try {
      await sendVerificationEmail(user.email, token);
    } catch (emailErr) {
      console.error('[resend-verification] email failed', emailErr?.message || emailErr);
      throw new AppError('Could not resend verification', 500);
    }

    return { ok: true };
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[resend-verification] error', err);
    throw new AppError('Could not resend verification', 500);
  }
}

async function forgotPassword(email) {
  try {
    if (!email) {
      throw new AppError('Email required', 400);
    }
    const lower = email.toLowerCase().trim();
    const user = await User.findOne({ email: lower });
    if (user) {
      const token = generateToken();
      user.resetToken = token;
      user.resetExpires = new Date(Date.now() + RESET_TTL_MS);
      await user.save();
      try {
        await sendResetEmail(user.email, token);
      } catch (emailErr) {
        console.error('[forgot-password] email failed', emailErr?.message || emailErr);
        // Continue; we don't want to expose that email sending failed
      }
    }
    return { ok: true };
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[forgot-password] error', err);
    throw new AppError('Could not process request', 500);
  }
}

async function resetPassword(token, newPassword) {
  try {
    if (!token || !newPassword) {
      throw new AppError('Token and password required', 400);
    }
    if (newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    const user = await User.findOne({ resetToken: token });
    if (!user || !user.resetExpires || user.resetExpires.getTime() < Date.now()) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetExpires = null;
    await user.save();

    return { ok: true };
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[reset-password] error', err);
    throw new AppError('Reset failed', 500);
  }
}

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
