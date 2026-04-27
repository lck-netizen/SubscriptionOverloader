const dashboardService = require('../services/dashboardService');

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

async function getStats(req, res) {
  const stats = await dashboardService.getDashboardStats(req.user._id, req.user.monthlyBudget);
  sendSuccess(res, 200, stats);
}

module.exports = {
  getStats,
};
