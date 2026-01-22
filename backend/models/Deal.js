import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema({
  dealId: {
    type: String,
    unique: true,
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
  dealType: {
    type: String,
    enum: ['Training', 'Enablement', 'Consulting', 'Resource Support'],
    default: 'Training'
  },
  revenueCategory: {
    type: String,
    enum: ['Corporate', 'Academic', 'School'],
    default: 'Corporate'
  },
  totalOrderValue: {
    type: Number,
    required: true
  },
  trainerCost: {
    type: Number,
    default: 0
  },
  labCost: {
    type: Number,
    default: 0
  },
  logisticsCost: {
    type: Number,
    default: 0
  },
  contentCost: {
    type: Number,
    default: 0
  },
  contingencyBuffer: {
    type: Number,
    default: 0
  },
  travelCost: {
    type: Number,
    default: 0
  },
  marketingCost: {
    type: Number,
    default: 0
  },
  otherCost: {
    type: Number,
    default: 0
  },
  grossMarginPercent: {
    type: Number,
    default: 0
  },
  contributionMargin: {
    type: Number,
    default: 0
  },
  breakEvenValue: {
    type: Number,
    default: 0
  },
  whatIfScenarioInputs: {
    type: mongoose.Schema.Types.Mixed
  },
  marginThresholdStatus: {
    type: String,
    enum: ['Above Threshold', 'Below Threshold', 'At Threshold'],
    default: 'At Threshold'
  },
  exceptionJustification: {
    type: String
  },
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  approvalTimestamp: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vendorProposalUpload: {
    type: String // File path or URL for vendor proposal document
  },
  costBreakdownPerVendor: [{
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    vendorName: {
      type: String
    },
    costType: {
      type: String,
      enum: ['Trainer', 'Lab', 'Logistics', 'Content', 'Other']
    },
    amount: {
      type: Number
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

dealSchema.pre('save', async function (next) {
  try {
    // 1. Calculate Total Cost (Deterministic Math)
    const totalCost = (this.trainerCost || 0) +
      (this.labCost || 0) +
      (this.logisticsCost || 0) +
      (this.contentCost || 0) +
      (this.contingencyBuffer || 0) +
      (this.travelCost || 0) +
      (this.marketingCost || 0) +
      (this.otherCost || 0);

    // 2. Calculate Gross Profit (Contribution Margin)
    this.contributionMargin = this.totalOrderValue - totalCost;
    this.breakEvenValue = totalCost;

    // 3. Calculate GP %
    this.grossMarginPercent = this.totalOrderValue > 0
      ? (this.contributionMargin / this.totalOrderValue) * 100
      : 0;

    // 4. Determine Status (Rule-based)
    if (this.grossMarginPercent < 15) {
      this.marginThresholdStatus = 'Below Threshold';
    } else if (this.grossMarginPercent >= 15 && this.grossMarginPercent <= 25) {
      this.marginThresholdStatus = 'At Threshold'; // Adjusted standard ranges
    } else {
      this.marginThresholdStatus = 'Above Threshold';
    }

    // OPTIONAL: Still use AI for qualitative risk, but NOT for math.
    // For now, removing AI from this hook entirely to speed up saving and avoid 401 errors.

    this.updatedAt = Date.now();
    next();
  } catch (error) {
    console.error('Error in Deal pre-save calculation:', error);
    next(error);
  }
});

export default mongoose.model('Deal', dealSchema);
