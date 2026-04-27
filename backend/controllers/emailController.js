const emailService = require('../services/emailService');

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

async function sendTestEmailHandler(req, res) {
  const { email } = req.body || {};
  const result = await emailService.sendTestEmailToUser(req.user, email);
  const payload = result; // { ok: true, to, id }
  sendSuccess(res, 200, payload);
}

module.exports = {
  sendTestEmail: sendTestEmailHandler,
};
