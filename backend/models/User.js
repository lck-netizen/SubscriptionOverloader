const mongoose = require('mongoose');
const path = require('path');

const userSchema = new mongoose.Schema(
  {
    // Core authentication
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false, index: true }, // indexed for verification queries
    verificationToken: { type: String, sparse: true, default: null },
    verificationExpires: { type: Date, default: null },
    resetToken: { type: String, sparse: true, default: null },
    resetExpires: { type: Date, default: null },

    // Profile
    profilePicture: { type: String, default: '' },
    monthlyBudget: { type: Number, default: 0, min: 0 },
    isAdmin: { type: Boolean, default: false, index: true }, // indexed for admin queries

    // Extended profile fields
    bio: { type: String, maxlength: 500, default: '' },
    favoriteOTT: [{ type: String, default: [] }],
    favoriteMovies: [{ type: String, default: [] }],
    favoriteServices: [{ type: String, default: [] }],
    dateOfBirth: { type: Date, default: null },
    phoneNumber: { type: String, default: '' },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      zipCode: { type: String, default: '' },
    },
    website: { type: String, default: '' },
    socialLinks: {
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },

    // New: Account & preferences
    lastLoginAt: { type: Date, default: null, index: true }, // for security/analytics
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'deleted', 'pending'],
      default: 'active',
      index: true,
    },
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        renewalReminders: { type: Boolean, default: true },
        budgetAlerts: { type: Boolean, default: true },
      },
      theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
      language: { type: String, default: 'en' },
    },

    // New: Tracking for insights
    onboardingCompleted: { type: Boolean, default: false },
    featureFlags: {
      advancedAnalytics: { type: Boolean, default: false },
      earlyAccess: { type: Boolean, default: false },
    },

    // Deprecated: legacy fields kept for backward compatibility
    // (none in current schema)
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common queries
userSchema.index({ email: 1, isVerified: 1 }); // email lookup optimization
userSchema.index({ createdAt: -1 }); // admin/sorting
userSchema.index({ lastLoginAt: -1 }); // recent activity
userSchema.index({ accountStatus: 1, createdAt: -1 }); // active users report

// Virtual: profilePictureUrl (computed, not stored)
userSchema.virtual('profilePictureUrl').get(function () {
  if (!this.profilePicture) return null;
  const baseUrl =
    process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${baseUrl}/api/uploads/${path.basename(this.profilePicture)}`;
});

// Virtual: subscriptionCount (cached via aggregation in future)
userSchema.virtual('subscriptionCount', {
  ref: 'Subscription',
  localField: '_id',
  foreignField: 'userId',
  count: true,
});

// Virtual: unreadNotificationCount
userSchema.virtual('unreadNotificationCount', {
  ref: 'Notification',
  localField: '_id',
  foreignField: 'userId',
  count: true,
  match: { read: false },
});

userSchema.methods.toPublicJSON = function (req) {
  let baseUrl;
  if (req) {
    const proto = req.protocol || (req.headers?.secure ? 'https' : 'http');
    const host = req.get('host') || 'localhost:8001';
    baseUrl = `${proto}://${host}`;
  } else {
    baseUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  const base = {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    isVerified: this.isVerified,
    profilePicture: this.profilePicture,
    profilePictureUrl: this.profilePicture
      ? `${baseUrl}/api/uploads/${path.basename(this.profilePicture)}`
      : this.profilePictureUrl || null, // fallback to virtual if stored path is relative
    monthlyBudget: this.monthlyBudget,
    createdAt: this.createdAt,
    // Extended profile
    bio: this.bio,
    favoriteOTT: this.favoriteOTT,
    favoriteMovies: this.favoriteMovies,
    favoriteServices: this.favoriteServices,
    dateOfBirth: this.dateOfBirth,
    phoneNumber: this.phoneNumber,
    address: this.address,
    website: this.website,
    socialLinks: this.socialLinks,
    // New fields (backward compatible - will be undefined for old documents)
    lastLoginAt: this.lastLoginAt || null,
    accountStatus: this.accountStatus || 'active',
    preferences: this.preferences || {
      notifications: { email: true, push: true, renewalReminders: true, budgetAlerts: true },
      theme: 'light',
      language: 'en',
    },
    onboardingCompleted: this.onboardingCompleted || false,
    featureFlags: this.featureFlags || {
      advancedAnalytics: false,
      earlyAccess: false,
    },
  };

  if (this.isAdmin) {
    base.isAdmin = this.isAdmin;
  }

  return base;
};

module.exports = mongoose.model('User', userSchema);
