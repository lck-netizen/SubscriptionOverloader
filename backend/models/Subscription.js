const mongoose = require('mongoose');

const CATEGORIES = ['OTT', 'SaaS', 'Cloud', 'Fitness', 'Music', 'News', 'Learning', 'Gaming', 'Other'];
const BILLING_CYCLES = ['monthly', 'yearly'];
const STATUSES = ['active', 'cancelled', 'expired'];

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceName: { type: String, required: true, trim: true },
    cost: { type: Number, required: true, min: 0 },
    billingCycle: { type: String, enum: BILLING_CYCLES, default: 'monthly' },
    renewalDate: { type: Date, required: true },
    category: { type: String, enum: CATEGORIES, default: 'Other' },
    status: { type: String, enum: STATUSES, default: 'active' },
    lastPaymentDate: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

subscriptionSchema.statics.CATEGORIES = CATEGORIES;
subscriptionSchema.statics.BILLING_CYCLES = BILLING_CYCLES;
subscriptionSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Subscription', subscriptionSchema);
