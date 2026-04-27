const mongoose = require('mongoose');

const NOTIFICATION_TYPES = ['renewal', 'budget', 'system', 'email', 'promo', 'security'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Content
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      default: 'system',
      index: true, // filtered by type
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: 'medium',
      index: true,
    },

    // State
    read: { type: Boolean, default: false, index: true },
    isSeen: { type: Boolean, default: false }, // viewed in UI vs clicked
    expiresAt: { type: Date, default: null }, // TTL index defined below

    // Action
    actionUrl: { type: String, default: '' }, // deep link to relevant page
    actionLabel: { type: String, default: '' }, // button text

    // Metadata for insights
    metadata: {
      subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null },
      triggeredBy: { type: String, default: 'system' }, // 'system', 'user', 'cron'
      channel: { type: String, enum: ['in-app', 'email', 'push'], default: 'in-app' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common query patterns
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 }); // unread listing + pagination
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 }); // filter by type
notificationSchema.index({ userId: 1, priority: -1, createdAt: -1 }); // prioritized listing
// TTL index for auto-cleanup (expires at field value)
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'expiresAt_ttl' });

// Virtual: isExpired
notificationSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date(this.expiresAt) < new Date();
});

// Virtual: timeSinceCreated (human-friendly)
notificationSchema.virtual('timeAgo').get(function () {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffMs = now - created;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
});

// Method: mark as read
notificationSchema.methods.markRead = function () {
  this.read = true;
  return this.save();
};

// Method: mark as seen
notificationSchema.methods.markSeen = function () {
  this.isSeen = true;
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
