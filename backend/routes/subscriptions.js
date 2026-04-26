const express = require('express');
const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Calculate next billing date based on last payment / renewal & cycle
function calcNextRenewal(renewalDate, lastPaymentDate, billingCycle) {
  const base = lastPaymentDate ? new Date(lastPaymentDate) : new Date(renewalDate);
  const next = new Date(base);
  if (billingCycle === 'yearly') {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

router.get('/', async (req, res) => {
  try {
    const { category, status, search, minCost, maxCost, sort } = req.query;
    const q = { userId: req.user._id };
    if (category && category !== 'all') q.category = category;
    if (status && status !== 'all') q.status = status;
    if (search) q.serviceName = { $regex: search, $options: 'i' };
    if (minCost || maxCost) {
      q.cost = {};
      if (minCost) q.cost.$gte = Number(minCost);
      if (maxCost) q.cost.$lte = Number(maxCost);
    }

    let sortSpec = { renewalDate: 1 };
    if (sort === 'cost-desc') sortSpec = { cost: -1 };
    else if (sort === 'cost-asc') sortSpec = { cost: 1 };
    else if (sort === 'renewal-asc') sortSpec = { renewalDate: 1 };
    else if (sort === 'renewal-desc') sortSpec = { renewalDate: -1 };
    else if (sort === 'name') sortSpec = { serviceName: 1 };

    const subs = await Subscription.find(q).sort(sortSpec).lean();
    res.json({ subscriptions: subs });
  } catch (err) {
    console.error('[subs:list]', err);
    res.status(500).json({ detail: 'Could not fetch subscriptions' });
  }
});

router.get('/meta', async (req, res) => {
  res.json({
    categories: Subscription.CATEGORIES,
    billingCycles: Subscription.BILLING_CYCLES,
    statuses: Subscription.STATUSES,
  });
});

router.post('/', async (req, res) => {
  try {
    const { serviceName, cost, billingCycle, renewalDate, category, status, lastPaymentDate, notes } = req.body || {};
    if (!serviceName || cost == null || !renewalDate) {
      return res.status(400).json({ detail: 'serviceName, cost, and renewalDate are required' });
    }
    const sub = await Subscription.create({
      userId: req.user._id,
      serviceName: serviceName.trim(),
      cost: Number(cost),
      billingCycle: billingCycle || 'monthly',
      renewalDate: new Date(renewalDate),
      category: category || 'Other',
      status: status || 'active',
      lastPaymentDate: lastPaymentDate ? new Date(lastPaymentDate) : null,
      notes: notes || '',
    });

    await Notification.create({
      userId: req.user._id,
      title: 'Subscription added',
      message: `${sub.serviceName} ($${sub.cost.toFixed(2)} ${sub.billingCycle}) added to your tracker.`,
      type: 'system',
    });

    res.status(201).json({ subscription: sub });
  } catch (err) {
    console.error('[subs:create]', err);
    res.status(500).json({ detail: 'Could not create subscription' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const allowed = ['serviceName', 'cost', 'billingCycle', 'renewalDate', 'category', 'status', 'lastPaymentDate', 'notes'];
    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];
    if (update.cost != null) update.cost = Number(update.cost);
    if (update.renewalDate) update.renewalDate = new Date(update.renewalDate);
    if (update.lastPaymentDate) update.lastPaymentDate = new Date(update.lastPaymentDate);

    const sub = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      update,
      { new: true }
    );
    if (!sub) return res.status(404).json({ detail: 'Subscription not found' });
    res.json({ subscription: sub });
  } catch (err) {
    console.error('[subs:update]', err);
    res.status(500).json({ detail: 'Could not update subscription' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await Subscription.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!result) return res.status(404).json({ detail: 'Subscription not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[subs:delete]', err);
    res.status(500).json({ detail: 'Could not delete subscription' });
  }
});

router.post('/:id/simulate-payment', async (req, res) => {
  try {
    const { amount, paymentDate } = req.body || {};
    const sub = await Subscription.findOne({ _id: req.params.id, userId: req.user._id });
    if (!sub) return res.status(404).json({ detail: 'Subscription not found' });
    const last = paymentDate ? new Date(paymentDate) : new Date();
    sub.lastPaymentDate = last;
    if (amount != null) sub.cost = Number(amount);
    sub.renewalDate = calcNextRenewal(sub.renewalDate, last, sub.billingCycle);
    await sub.save();
    res.json({ subscription: sub });
  } catch (err) {
    console.error('[subs:simulate]', err);
    res.status(500).json({ detail: 'Could not simulate payment' });
  }
});

module.exports = router;
