const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const { AppError } = require('../middleware/errorHandler');

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

function serializeTransaction(tx) {
  const subscription = tx.subscriptionId && typeof tx.subscriptionId === 'object'
    ? tx.subscriptionId
    : null;

  return {
    ...tx,
    serviceName: subscription?.serviceName || tx.serviceName || '',
    category: tx.category || subscription?.category || '',
    subscription: subscription || null,
  };
}

async function getTransactions(req, res) {
  try {
    const { startDate, endDate, category, status, sort, subscriptionId } = req.query;
    const userId = req.user._id;

    const q = { userId };

    // Filter by subscription if specified
    if (subscriptionId) {
      q.subscriptionId = subscriptionId;
    }

    // Filter by category
    if (category && category !== 'all') {
      q.category = category;
    }

    // Filter by status
    if (status && status !== 'all') {
      q.status = status;
    }

    // Filter by date range
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

    // Build sort
    let sortSpec = { date: -1 };
    if (sort === 'date-asc') sortSpec = { date: 1 };
    else if (sort === 'amount-desc') sortSpec = { amount: -1 };
    else if (sort === 'amount-asc') sortSpec = { amount: 1 };
    else if (sort === 'status') sortSpec = { status: 1, date: -1 };

    const transactions = await Transaction.find(q)
      .sort(sortSpec)
      .populate('subscriptionId', 'serviceName category')
      .lean();

    sendSuccess(res, 200, {
      transactions: transactions.map(serializeTransaction),
      count: transactions.length,
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[tx:list]', err);
    throw new AppError('Could not fetch transactions', 500);
  }
}

async function getTransaction(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const tx = await Transaction.findOne({ _id: id, userId })
      .populate('subscriptionId', 'serviceName category status')
      .lean();

    if (!tx) {
      throw new AppError('Transaction not found', 404);
    }

    sendSuccess(res, 200, { transaction: serializeTransaction(tx) });
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[tx:get]', err);
    throw new AppError('Could not fetch transaction', 500);
  }
}

module.exports = {
  getTransactions,
  getTransaction,
};
