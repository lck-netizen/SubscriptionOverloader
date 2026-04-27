const mongoose = require('mongoose');

const PAYMENT_STATUS = ['success', 'failed', 'pending', 'refunded'];
const PAYMENT_METHODS = ['card', 'upi', 'netbanking', 'wallet', 'auto-debit'];

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['INR', 'USD', 'EUR', 'GBP'], default: 'INR' },
    status: {
      type: String,
      enum: PAYMENT_STATUS,
      default: 'success',
      index: true,
    },
    date: { type: Date, required: true, index: true },
    category: { type: String, default: '' }, // copied from subscription for quick access
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'auto-debit',
    },
    gatewayReference: { type: String, default: '' }, // payment gateway transaction ID
    notes: { type: String, default: '' },
    failureReason: { type: String, default: '' }, // if status === 'failed'
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common queries
transactionSchema.index({ userId: 1, date: -1 }); // user's transaction history
transactionSchema.index({ subscriptionId: 1, date: -1 }); // subscription payment history
transactionSchema.index({ userId: 1, status: 1, date: -1 }); // filter by status

// Virtual: isRecent (last 30 days)
transactionSchema.virtual('isRecent').get(function () {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return new Date(this.date) >= thirtyDaysAgo;
});

module.exports = mongoose.model('Transaction', transactionSchema);
