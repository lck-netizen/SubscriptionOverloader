const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, trim: true, index: true },
    severity: {
      type: String,
      enum: ['info', 'warning', 'success', 'error'],
      default: 'info',
      index: true,
    },
    message: { type: String, required: true, trim: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    source: { type: String, default: 'generated' },
    generatedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

insightSchema.index({ userId: 1, generatedAt: -1 });

module.exports = mongoose.models.Insight || mongoose.model('Insight', insightSchema);
