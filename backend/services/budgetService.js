const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');
const { sendBudgetAlert } = require('../utils/email');

const monthlyCost = (s) => (s.billingCycle === 'yearly' ? s.cost / 12 : s.cost);

/**
 * Check if user's monthly subscription spending meets or exceeds their budget.
 * If so, creates an in-app notification and sends an email alert.
 * @param {ObjectId} userId - The user ID to check
 * @returns {Promise<{notified: boolean, totalMonthly: number, budget: number}>}
 */
async function checkBudget(userId) {
  const user = await User.findById(userId);
  if (!user || !user.monthlyBudget || user.monthlyBudget <= 0) {
    return { notified: false, totalMonthly: 0, budget: 0 };
  }

  const subs = await Subscription.find({ userId }).lean();
  const active = subs.filter((s) => s.status === 'active');
  const totalMonthly = active.reduce((sum, s) => sum + monthlyCost(s), 0);

  if (totalMonthly >= user.monthlyBudget) {
    // Avoid duplicate notifications: check if a budget alert was sent recently (within last 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await Notification.findOne({
      userId,
      type: 'budget',
      createdAt: { $gte: yesterday },
    }).sort({ createdAt: -1 });

    if (!recent) {
      await Notification.create({
        userId,
        title: 'Budget limit reached',
        message: `Your monthly subscription spend ($${totalMonthly.toFixed(2)}) has reached your budget of $${user.monthlyBudget.toFixed(2)}.`,
        type: 'budget',
      });
      try {
        await sendBudgetAlert(user.email, user.name, totalMonthly, user.monthlyBudget);
      } catch (err) {
        console.error('[budget:email]', err);
      }
    }
    return { notified: true, totalMonthly, budget: user.monthlyBudget };
  }

  return { notified: false, totalMonthly, budget: user.monthlyBudget };
}

module.exports = { checkBudget };
