const { getInsightsForUser } = require('../services/insightsService');

function sendSuccess(res, status, payload, message = null) {
  const response = {
    success: true,
    data: payload,
  };
  if (message !== null) {
    response.message = message;
  }
  if (Array.isArray(payload)) {
    return res.status(status).json(response);
  }
  res.status(status).json({ ...response, ...payload });
}

async function getInsights(req, res) {
  const insights = await getInsightsForUser(req.user._id);
  sendSuccess(res, 200, insights);
}

module.exports = {
  getInsights,
};
