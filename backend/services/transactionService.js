const Transaction = require('../models/Transaction');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get all transactions for a user with optional filters
 */
async function getTransactions(userId, filters = {}) {
  try {
    const { startDate, endDate, category, status, sort, subscriptionId } = filters;

    const q = { userId };

    if (subscriptionId) {
      q.subscriptionId = subscriptionId;
    }

    if (category && category !== 'all') {
      q.category = category;
    }

    if (status && status !== 'all') {
      q.status = status;
    }

    if (startDate || endDate) {
      q.date = {};
      if (startDate) {
        q.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        q.date.$lte = end;
      }
    }

    let sortSpec = { date: -1 };
    if (sort === 'date-asc') sortSpec = { date: 1 };
    else if (sort === 'amount-desc') sortSpec = { amount: -1 };
    else if (sort === 'amount-asc') sortSpec = { amount: 1 };
    else if (sort === 'status') sortSpec = { status: 1, date: -1 };

    const transactions = await Transaction.find(q)
      .sort(sortSpec)
      .populate('subscriptionId', 'serviceName category status')
      .lean();

    return { transactions, count: transactions.length };
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[tx:get-all]', err);
    throw new AppError('Could not fetch transactions', 500);
  }
}

/**
 * Get a single transaction by ID
 */
async function getTransaction(userId, id) {
  try {
    const tx = await Transaction.findOne({ _id: id, userId })
      .populate('subscriptionId', 'serviceName category status')
      .lean();

    if (!tx) {
      throw new AppError('Transaction not found', 404);
    }

    return { transaction: tx };
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[tx:get-one]', err);
    throw new AppError('Could not fetch transaction', 500);
  }
}

module.exports = {
  getTransactions,
  getTransaction,
};