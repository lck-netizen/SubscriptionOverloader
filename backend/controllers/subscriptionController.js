const Subscription = require('../models/Subscription');
const subscriptionService = require('../services/subscriptionService');

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

async function getSubscriptions(req, res) {
  const subs = await subscriptionService.getSubscriptions(req.user._id, req.query);
  const payload = { subscriptions: subs };
  sendSuccess(res, 200, payload);
}

async function getSubscriptionMeta(req, res) {
  const payload = {
    categories: Subscription.CATEGORIES,
    billingCycles: Subscription.BILLING_CYCLES,
    statuses: Subscription.STATUSES,
  };
  sendSuccess(res, 200, payload);
}

async function createSubscription(req, res) {
  const sub = await subscriptionService.createSubscription(req.user._id, req.body);
  const payload = { subscription: sub };
  sendSuccess(res, 201, payload);
}

async function updateSubscription(req, res) {
  const sub = await subscriptionService.updateSubscription(req.user._id, req.params.id, req.body);
  const payload = { subscription: sub };
  sendSuccess(res, 200, payload);
}

async function deleteSubscription(req, res) {
  const result = await subscriptionService.deleteSubscription(req.user._id, req.params.id);
  const payload = result; // { ok: true }
  sendSuccess(res, 200, payload);
}

async function simulatePayment(req, res) {
  const { amount, paymentDate } = req.body;
  const sub = await subscriptionService.simulatePayment(req.user._id, req.params.id, {
    amount,
    paymentDate,
  });
  const payload = { subscription: sub };
  sendSuccess(res, 200, payload);
}

module.exports = {
  getSubscriptions,
  getSubscriptionMeta,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  simulatePayment,
};
