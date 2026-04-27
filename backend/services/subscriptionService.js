const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');
const { checkBudget } = require('./budgetService');
const { AppError } = require('../middleware/errorHandler');

function monthlyCost(s) {
  return s.billingCycle === 'yearly' ? s.cost / 12 : s.cost;
}

function yearlyCost(s) {
  return s.billingCycle === 'yearly' ? s.cost : s.cost * 12;
}

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

async function getSubscriptions(userId, filters = {}) {
  try {
    const { category, status, search, minCost, maxCost, sort, includeTransactions } = filters;

    const q = { userId };
    if (category && category !== 'all') q.category = category;
    if (status && status !== 'all') q.status = status;
    if (search) q.serviceName = { $regex: search, $options: 'i' };

    if ((minCost !== undefined && minCost !== '') || (maxCost !== undefined && maxCost !== '')) {
      q.cost = {};
      if (minCost !== undefined && minCost !== '') q.cost.$gte = Number(minCost);
      if (maxCost !== undefined && maxCost !== '') q.cost.$lte = Number(maxCost);
      if (Object.keys(q.cost).length === 0) delete q.cost;
    }

    let sortSpec = { renewalDate: 1 };
    if (sort === 'cost-desc') sortSpec = { cost: -1 };
    else if (sort === 'cost-asc') sortSpec = { cost: 1 };
    else if (sort === 'renewal-asc') sortSpec = { renewalDate: 1 };
    else if (sort === 'renewal-desc') sortSpec = { renewalDate: -1 };
    else if (sort === 'name') sortSpec = { serviceName: 1 };

    let query = Subscription.find(q).sort(sortSpec);
    if (includeTransactions === 'true') {
      query = query.populate('transactions');
    }
    return await query.lean({ virtuals: true });
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[subs:list]', err);
    throw new AppError('Could not fetch subscriptions', 500);
  }
}

async function createSubscription(userId, data) {
  try {
    const { serviceName, cost, billingCycle, renewalDate, category, status, lastPaymentDate, notes } = data;

    if (!serviceName || cost == null || !renewalDate) {
      throw new AppError('serviceName, cost, and renewalDate are required', 400);
    }

    const sub = await Subscription.create({
      userId,
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
      userId,
      title: 'Subscription added',
      message: `${sub.serviceName} ($${sub.cost.toFixed(2)} ${sub.billingCycle}) added to your tracker.`,
      type: 'system',
    });

    checkBudget(userId).catch((err) => console.error('[budget:check]', err));

    return sub;
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[subs:create]', err);
    throw new AppError('Could not create subscription', 500);
  }
}

async function updateSubscription(userId, id, updates) {
  try {
    const allowed = ['serviceName', 'cost', 'billingCycle', 'renewalDate', 'category', 'status', 'lastPaymentDate', 'notes'];
    const update = {};

    for (const k of allowed) {
      if (k in updates) update[k] = updates[k];
    }
    if (update.cost != null) update.cost = Number(update.cost);
    if (update.renewalDate) update.renewalDate = new Date(update.renewalDate);
    if (update.lastPaymentDate) update.lastPaymentDate = new Date(update.lastPaymentDate);

    const sub = await Subscription.findOneAndUpdate(
      { _id: id, userId },
      update,
      { new: true }
    );

    if (!sub) {
      throw new AppError('Subscription not found', 404);
    }

    checkBudget(userId).catch((err) => console.error('[budget:check]', err));

    return sub;
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[subs:update]', err);
    throw new AppError('Could not update subscription', 500);
  }
}

async function deleteSubscription(userId, id) {
  try {
    const result = await Subscription.findOneAndDelete({ _id: id, userId });
    if (!result) {
      throw new AppError('Subscription not found', 404);
    }
    return { ok: true };
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[subs:delete]', err);
    throw new AppError('Could not delete subscription', 500);
  }
}

async function simulatePayment(userId, id, { amount, paymentDate }) {
  try {
    const sub = await Subscription.findOne({ _id: id, userId });
    if (!sub) {
      throw new AppError('Subscription not found', 404);
    }

    const last = paymentDate ? new Date(paymentDate) : new Date();
    sub.lastPaymentDate = last;
    if (amount != null) sub.cost = Number(amount);
    sub.renewalDate = calcNextRenewal(sub.renewalDate, last, sub.billingCycle);
    await sub.save();

    checkBudget(userId).catch((err) => console.error('[budget:check]', err));

    return sub;
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[subs:simulate]', err);
    throw new AppError('Could not simulate payment', 500);
  }
}

module.exports = {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  simulatePayment,
  monthlyCost,
  yearlyCost,
};
