const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');
const { sendBudgetAlert } = require('../utils/email');
const { AppError } = require('../middleware/errorHandler');

function monthlyCost(s) {
  return s.billingCycle === 'yearly' ? s.cost / 12 : s.cost;
}

function yearlyCost(s) {
  return s.billingCycle === 'yearly' ? s.cost : s.cost * 12;
}

async function getDashboardStats(userId, userBudget = 0) {
  try {
    const subs = await Subscription.find({ userId }).lean();
    const active = subs.filter((s) => s.status === 'active');

    const totalMonthly = active.reduce((sum, s) => sum + monthlyCost(s), 0);
    const totalYearly = active.reduce((sum, s) => sum + yearlyCost(s), 0);

    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming = active
      .filter((s) => new Date(s.renewalDate) >= now && new Date(s.renewalDate) <= in7)
      .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));

    const byCategoryMap = {};
    for (const s of active) {
      byCategoryMap[s.category] = (byCategoryMap[s.category] || 0) + monthlyCost(s);
    }
    const categoryBreakdown = Object.entries(byCategoryMap).map(([category, value]) => ({
      category,
      value: Number(value.toFixed(2)),
    }));

    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthly.push({
        month: d.toLocaleString('en-US', { month: 'short' }),
        year: d.getFullYear(),
        amount: Number(totalMonthly.toFixed(2)),
      });
    }

    let cum = 0;
    const trend = monthly.map((m) => {
      cum += m.amount;
      return { month: m.month, value: Number(cum.toFixed(2)) };
    });

    const budget = userBudget || 0;
    const overBudget = budget > 0 && totalMonthly > budget;
    const budgetUsedPct = budget > 0 ? Math.min(100, Math.round((totalMonthly / budget) * 100)) : 0;

    return {
      kpis: {
        totalMonthly: Number(totalMonthly.toFixed(2)),
        totalYearly: Number(totalYearly.toFixed(2)),
        activeCount: active.length,
        totalCount: subs.length,
        upcomingCount: upcoming.length,
      },
      upcoming: upcoming.slice(0, 5),
      charts: {
        categoryBreakdown,
        monthly,
        trend,
      },
      budget: {
        amount: budget,
        used: Number(totalMonthly.toFixed(2)),
        usedPct: budgetUsedPct,
        overBudget,
        suggestion: overBudget
          ? 'Consider cancelling rarely used subscriptions to stay within budget.'
          : null,
      },
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[dashboard:stats]', err);
    throw new AppError('Could not load dashboard', 500);
  }
}

async function checkAndAlertBudget(userId) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.monthlyBudget || user.monthlyBudget <= 0) {
      return { notified: false, totalMonthly: 0, budget: 0 };
    }

    const stats = await getDashboardStats(userId, user.monthlyBudget);
    const totalMonthly = stats.kpis.totalMonthly;

    if (totalMonthly >= user.monthlyBudget) {
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
  } catch (err) {
    if (err instanceof AppError) throw err;
    // Log but don't throw - this is called as side effect
    console.error('[budget:check]', err);
    return { notified: false, totalMonthly: 0, budget: 0 };
  }
}

module.exports = {
  getDashboardStats,
  checkAndAlertBudget,
  monthlyCost,
  yearlyCost,
};
