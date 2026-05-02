const { signAccessToken, setAuthCookie, clearAuthCookie } = require('../middleware/auth');
const authService = require('../services/authService');

function sendSuccess(res, status, payload, message = null) {
  const response = {
    success: true,
    data: payload,
  };
  if (message !== null) {
    response.message = message;
  }

  // Spread payload to maintain backward compatibility (preserve old top-level fields)
  res.status(status).json({ ...response, ...payload });
}

async function register(req, res) {
  const { name, email, password } = req.body;

  const user = await authService.registerUser({ name, email, password });

  const token = signAccessToken(user);
  setAuthCookie(res, token);

  const payload = { user: user.toPublicJSON(req), token };
  sendSuccess(res, 201, payload);
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await authService.loginUser({ email, password });

  const token = signAccessToken(user);
  setAuthCookie(res, token);
  const payload = { user: user.toPublicJSON(req), token };
  sendSuccess(res, 200, payload);
}

function logout(req, res) {
  clearAuthCookie(res);
  const payload = { ok: true };
  sendSuccess(res, 200, payload);
}

function getMe(req, res) {
  const payload = { user: req.user.toPublicJSON(req) };
  sendSuccess(res, 200, payload);
}

async function verifyEmail(req, res) {
  const { token } = req.query;
  const user = await authService.verifyEmail(token);
  const payload = { ok: true, user: user.toPublicJSON(req) };
  sendSuccess(res, 200, payload);
}

async function resendVerification(req, res) {
  const result = await authService.resendVerification(req.user);
  const payload = result;
  sendSuccess(res, 200, payload);
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  const payload = result;
  sendSuccess(res, 200, payload);
}

async function resetPassword(req, res) {
  const { token, password } = req.body;
  const result = await authService.resetPassword(token, password);
  const payload = result;
  sendSuccess(res, 200, payload);
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
