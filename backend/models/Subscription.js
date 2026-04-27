const mongoose = require('mongoose');

const CATEGORIES = ['OTT', 'SaaS', 'Cloud', 'Fitness', 'Music', 'News', 'Learning', 'Gaming', 'Other'];
const BILLING_CYCLES = ['monthly', 'yearly'];
const STATUSES = ['active', 'cancelled', 'expired'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Identity
    serviceName: { type: String, required: true, trim: true },
    serviceLogo: { type: String, default: '' }, // new: optional logo URL/path
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'Other',
      index: true,
    },

    // Billing
    cost: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      enum: CURRENCIES,
      default: 'USD',
    },
    billingCycle: {
      type: String,
      enum: BILLING_CYCLES,
      default: 'monthly',
    },
    renewalDate: { type: Date, required: true, index: true },
    autoRenew: { type: Boolean, default: true },

    // Status tracking
    status: {
      type: String,
      enum: STATUSES,
      default: 'active',
      index: true,
    },
    lastPaymentDate: { type: Date, default: null },
    cancellationDate: { type: Date, default: null }, // new: track when cancelled
    reactivationDate: { type: Date, default: null }, // new: track if re-activated

    // Pricing history (for tracking cost changes)
    priceHistory: [
      {
        amount: { type: Number, required: true },
        currency: { type: String, enum: CURRENCIES, default: 'USD' },
        changedAt: { type: Date, default: Date.now },
        reason: { type: String, default: '' },
      },
    ],

    // Reminder settings
    reminderEnabled: { type: Boolean, default: true },
    reminderDaysBefore: {
      type: Number,
      min: 0,
      max: 30,
      default: 7,
    },

    // Payment method reference (future integration)
    paymentMethod: {
      provider: { type: String, default: '' }, // e.g., 'stripe', 'paypal'
      externalId: { type: String, default: '' }, // provider's subscription ID
      lastFourDigits: { type: String, default: '' },
      cardBrand: { type: String, default: '' },
    },

    // Notes
    notes: { type: String, default: '' },

    // New: Usage tracking (for insights)
    usage: {
      lastUsedAt: { type: Date, default: null },
      usageCount: { type: Number, default: 0, min: 0 },
      estimatedValue: { type: Number, default: 0 }, // user-provided value rating
    },

    // New: Custom tags for organization
    tags: [{ type: String, default: [] }],

    // New: Deep linking for notifications
    actionUrl: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Statics
subscriptionSchema.statics.CATEGORIES = CATEGORIES;
subscriptionSchema.statics.BILLING_CYCLES = BILLING_CYCLES;
subscriptionSchema.statics.STATUSES = STATUSES;
subscriptionSchema.statics.CURRENCIES = CURRENCIES;

// Compound indexes for performance
subscriptionSchema.index({ userId: 1, status: 1 }); // filter by user + status
subscriptionSchema.index({ userId: 1, renewalDate: 1 }); // upcoming renewals
subscriptionSchema.index({ userId: 1, category: 1 }); // category breakdown
subscriptionSchema.index({ userId: 1, serviceName: 1 }); // find by name
subscriptionSchema.index({ renewalDate: 1, status: 1 }); // system-wide upcoming (for cron jobs)
subscriptionSchema.index({ cost: -1 }); // sort by cost

// Virtual: monthlyCost
subscriptionSchema.virtual('monthlyCost').get(function () {
  return this.billingCycle === 'yearly' ? this.cost / 12 : this.cost;
});

// Virtual: yearlyCost
subscriptionSchema.virtual('yearlyCost').get(function () {
  return this.billingCycle === 'yearly' ? this.cost : this.cost * 12;
});

// Virtual: isActive (computed)
subscriptionSchema.virtual('isActive').get(function () {
  return this.status === 'active' && new Date(this.renewalDate) > new Date();
});

// Virtual: daysUntilRenewal
subscriptionSchema.virtual('daysUntilRenewal').get(function () {
  const now = new Date();
  const renewal = new Date(this.renewalDate);
  const diffMs = renewal - now;
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
});

// Pre-save hook: push to priceHistory on cost change
subscriptionSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.$set && update.$set.cost !== undefined) {
    this.setOptions({ new: true });
    // We'll handle priceHistory in the service layer to avoid complexity
  }
  next();
});

// Virtual: transactions (populated from Transaction collection)
subscriptionSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'subscriptionId',
  justOne: false,
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
