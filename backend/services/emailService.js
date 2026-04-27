const { sendTestEmail } = require('../utils/email');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');

async function sendTestEmailToUser(user, targetEmail) {
  try {
    const email = (targetEmail && String(targetEmail).trim()) || user.email;
    const result = await sendTestEmail(email, user.name);

    if (result?.error) {
      throw new AppError(result.error.message || 'Email service rejected the request', 502);
    }

    await Notification.create({
      userId: user._id,
      title: 'Test email sent',
      message: `Instant test email dispatched to ${email}.`,
      type: 'email',
    });

    return { ok: true, to: email, id: result?.data?.id || null };
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[email:test] error', err);
    throw new AppError('Could not send test email', 500);
  }
}

module.exports = {
  sendTestEmailToUser,
};
