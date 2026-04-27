const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const Insight = require('../models/Insight');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

/**
 * Generate actionable insights from user's subscription and transaction data
 * @param {string} userId - MongoDB ObjectId of the user
 * @returns {Array} Array of insight objects {type, message, severity, data}
 */
async function generateInsights(userId) {
  try {
    const currency = 'INR ';

    const [user, subscriptions, transactions] = await Promise.all([
      User.findById(userId),
      Subscription.find({ userId }),
      Transaction.find({ userId }).sort({ date: -1 }),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const insights = [];
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentTransactions = transactions.filter(
      (tx) => new Date(tx.date) >= sixMonthsAgo && tx.status === 'success'
    );

    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthTx = recentTransactions.filter(
      (tx) => new Date(tx.date) >= currentMonthStart
    );

    const currentMonthTotal = currentMonthTx.reduce((sum, tx) => sum + tx.amount, 0);
    const monthlyBudget = user.monthlyBudget || 0;

    if (monthlyBudget > 0) {
      if (currentMonthTotal > monthlyBudget) {
        const overBy = currentMonthTotal - monthlyBudget;
        insights.push({
          type: 'budget',
          severity: 'warning',
          message: `You exceeded your monthly budget by ${currency}${overBy.toFixed(2)}. Current spend: ${currency}${currentMonthTotal.toFixed(2)}`,
          data: { currentMonthTotal, monthlyBudget, overBy },
        });
      } else if (currentMonthTotal > monthlyBudget * 0.8) {
        insights.push({
          type: 'budget',
          severity: 'warning',
          message: `You've used ${Math.round((currentMonthTotal / monthlyBudget) * 100)}% of your monthly budget. Stay cautious.`,
          data: {
            currentMonthTotal,
            monthlyBudget,
            usedPct: Math.round((currentMonthTotal / monthlyBudget) * 100),
          },
        });
      }
    }

    const categorySpending = {};
    recentTransactions.forEach((tx) => {
      categorySpending[tx.category] = (categorySpending[tx.category] || 0) + tx.amount;
    });

    const sortedCategories = Object.entries(categorySpending).sort((a, b) => b[1] - a[1]);
    if (sortedCategories.length > 0) {
      const topCategory = sortedCategories[0];
      const totalSpent = sortedCategories.reduce((sum, [, amount]) => sum + amount, 0);
      const topPct = totalSpent > 0 ? (topCategory[1] / totalSpent) * 100 : 0;

      insights.push({
        type: 'category',
        severity: topPct > 50 ? 'warning' : 'info',
        message: `Your highest spending category is ${topCategory[0]} (${currency}${topCategory[1].toFixed(2)}, ${topPct.toFixed(1)}%)`,
        data: { category: topCategory[0], amount: topCategory[1], percentage: topPct },
      });
    }

    const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');
    const sortedByCost = [...activeSubscriptions].sort((a, b) => b.cost - a.cost);
    const top2 = sortedByCost.slice(0, 2);

    if (top2.length >= 1) {
      const top1 = top2[0];
      insights.push({
        type: 'expensive',
        severity: 'info',
        message: `Your most expensive subscription is ${top1.serviceName} (${currency}${top1.cost}/${top1.billingCycle})`,
        data: { service: top1.serviceName, cost: top1.cost, billingCycle: top1.billingCycle },
      });

      if (top2.length >= 2) {
        const top2nd = top2[1];
        insights.push({
          type: 'expensive',
          severity: 'info',
          message: `Second highest: ${top2nd.serviceName} (${currency}${top2nd.cost}/${top2nd.billingCycle})`,
          data: { service: top2nd.serviceName, cost: top2nd.cost, billingCycle: top2nd.billingCycle },
        });
      }
    }

    const inactiveSubs = subscriptions.filter((s) => s.status !== 'active');
    if (inactiveSubs.length > 0) {
      const wastedMonthly = inactiveSubs.reduce(
        (sum, s) => sum + (s.billingCycle === 'yearly' ? s.cost / 12 : s.cost),
        0
      );

      insights.push({
        type: 'inactive',
        severity: 'warning',
        message: `You have ${inactiveSubs.length} inactive subscription(s) still costing ${currency}${wastedMonthly.toFixed(2)}/month`,
        data: { count: inactiveSubs.length, wastedMonthly, subscriptions: inactiveSubs.map((s) => s.serviceName) },
      });
    }

    const ottSpending = categorySpending.OTT || 0;
    const totalSpending = Object.values(categorySpending).reduce((a, b) => a + b, 0);
    if (totalSpending > 0 && ottSpending / totalSpending > 0.5) {
      insights.push({
        type: 'ott',
        severity: 'warning',
        message: `OTT services consume ${((ottSpending / totalSpending) * 100).toFixed(1)}% of your subscription budget. Consider reviewing streaming services.`,
        data: { ottPercentage: (ottSpending / totalSpending) * 100, ottAmount: ottSpending },
      });
    }

    const suggestions = [];

    if (inactiveSubs.length > 0) {
      const topInactive = [...inactiveSubs].sort((a, b) => b.cost - a.cost)[0];
      suggestions.push({
        type: 'suggestion',
        severity: 'success',
        message: `Cancel "${topInactive.serviceName}" to save ${currency}${topInactive.cost}/${topInactive.billingCycle}`,
        data: { action: 'cancel', subscription: topInactive.serviceName, savings: topInactive.cost },
      });
    }

    if (top2.length >= 1) {
      const topExp = top2[0];
      if (topExp.cost > 500) {
        suggestions.push({
          type: 'suggestion',
          severity: 'success',
          message: `Review "${topExp.serviceName}" (${currency}${topExp.cost}/${topExp.billingCycle}) for potential downgrade or cancellation`,
          data: { action: 'review', subscription: topExp.serviceName, cost: topExp.cost },
        });
      }
    }

    const monthlySubs = activeSubscriptions.filter(
      (s) => s.billingCycle === 'monthly' && s.cost >= 200
    );
    if (monthlySubs.length > 0) {
      const potentialSavings = monthlySubs.reduce((sum, s) => sum + s.cost * 12 * 0.15, 0);
      suggestions.push({
        type: 'suggestion',
        severity: 'success',
        message: `Consider yearly billing for ${monthlySubs.length} subscription(s). Potential savings: ~${currency}${Math.round(potentialSavings)}/year`,
        data: { action: 'switch-to-yearly', count: monthlySubs.length, potentialSavings },
      });
    }

    insights.push(...suggestions);

    if (currentMonthTotal <= monthlyBudget && monthlyBudget > 0) {
      insights.push({
        type: 'positive',
        severity: 'info',
        message: `You're within budget this month! ${currency}${currentMonthTotal.toFixed(2)} of ${currency}${monthlyBudget}`,
        data: { currentMonthTotal, monthlyBudget },
      });
    }

    const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingRenewals = activeSubscriptions.filter((s) => {
      const renewal = new Date(s.renewalDate);
      return renewal >= today && renewal <= next7Days;
    });

    if (upcomingRenewals.length > 0) {
      const totalUpcoming = upcomingRenewals.reduce((sum, s) => sum + s.cost, 0);
      insights.push({
        type: 'upcoming',
        severity: 'info',
        message: `${upcomingRenewals.length} subscription(s) renewing in next 7 days (${currency}${totalUpcoming.toFixed(2)})`,
        data: {
          count: upcomingRenewals.length,
          total: totalUpcoming,
          subscriptions: upcomingRenewals.map((s) => s.serviceName),
        },
      });
    }

    return insights;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('[generateInsights] Error:', error);
    throw new AppError('Failed to generate insights', 500);
  }
}

async function getInsightsForUser(userId) {
  try {
    const storedInsights = await Insight.find({ userId })
      .sort({ generatedAt: -1, createdAt: -1 })
      .lean();

    if (storedInsights.length > 0) {
      return storedInsights.map((insight) => ({
        type: insight.type,
        severity: insight.severity,
        message: insight.message,
        data: insight.data || {},
      }));
    }

    const generated = await generateInsights(userId);

    if (generated.length > 0) {
      await Insight.insertMany(
        generated.map((insight) => ({
          userId,
          type: insight.type,
          severity: insight.severity,
          message: insight.message,
          data: insight.data || {},
          source: 'api-fallback',
          generatedAt: new Date(),
        }))
      );
    }

    return generated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('[getInsightsForUser] Error:', error);
    throw new AppError('Failed to load insights', 500);
  }
}

module.exports = {
  generateInsights,
  getInsightsForUser,
};
