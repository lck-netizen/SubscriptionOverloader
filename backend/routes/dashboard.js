const express = require('express');
const Subscription = require('../models/Subscription');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const monthlyCost = (s) => (s.billingCycle === 'yearly' ? s.cost / 12 : s.cost);
const yearlyCost = (s) => (s.billingCycle === 'yearly' ? s.cost : s.cost * 12);

router.get('/stats', async (req, res) => {
  try {
    const subs = await Subscription.find({ userId: req.user._id }).lean();
    const active = subs.filter((s) => s.status === 'active');

    const totalMonthly = active.reduce((sum, s) => sum + monthlyCost(s), 0);
    const totalYearly = active.reduce((sum, s) => sum + yearlyCost(s), 0);

    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming = active
      .filter((s) => new Date(s.renewalDate) >= now && new Date(s.renewalDate) <= in7)
      .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));

    // category breakdown (monthly equivalent)
    const byCategoryMap = {};
    for (const s of active) {
      byCategoryMap[s.category] = (byCategoryMap[s.category] || 0) + monthlyCost(s);
    }
    const categoryBreakdown = Object.entries(byCategoryMap).map(([category, value]) => ({
      category,
      value: Number(value.toFixed(2)),
    }));

    // monthly breakdown (last 6 months) — simulate using each active subscription's monthly cost
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthly.push({
        month: d.toLocaleString('en-US', { month: 'short' }),
        year: d.getFullYear(),
        amount: Number(totalMonthly.toFixed(2)),
      });
    }

    // spending trend (cumulative running last 6 months)
    let cum = 0;
    const trend = monthly.map((m) => {
      cum += m.amount;
      return { month: m.month, value: Number(cum.toFixed(2)) };
    });

    const budget = req.user.monthlyBudget || 0;
    const overBudget = budget > 0 && totalMonthly > budget;
    const budgetUsedPct = budget > 0 ? Math.min(100, Math.round((totalMonthly / budget) * 100)) : 0;

    res.json({
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
    });
  } catch (err) {
    console.error('[dashboard:stats]', err);
    res.status(500).json({ detail: 'Could not load dashboard' });
  }
});

module.exports = router;
