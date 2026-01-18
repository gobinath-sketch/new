import mongoose from 'mongoose';

const revenueTargetSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2100
  },
  period: {
    type: String,
    required: true,
    enum: ['Yearly', 'Quarterly', 'H1', 'H2']
  },
  quarter: {
    type: Number,
    required: function() {
      return this.period === 'Quarterly';
    },
    min: 1,
    max: 4,
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  setBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  setAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index to ensure unique targets per period
revenueTargetSchema.index({ year: 1, period: 1, quarter: 1 }, { unique: true });

// Pre-save hook to update updatedAt
revenueTargetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const RevenueTarget = mongoose.model('RevenueTarget', revenueTargetSchema);

export default RevenueTarget;
