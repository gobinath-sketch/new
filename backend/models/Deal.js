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

dealSchema.pre('save', async function(next) {
  try {
    const totalCost = this.trainerCost + this.labCost + this.logisticsCost + this.contentCost + this.contingencyBuffer;
    
    // Use AI for margin calculation
    const { calculateMarginWithAI } = await import('../utils/aiDecisionEngine.js');
    const marginResult = await calculateMarginWithAI(this.totalOrderValue, {
      totalCost,
      trainerCost: this.trainerCost,
      labCost: this.labCost,
      logisticsCost: this.logisticsCost,
      contentCost: this.contentCost,
      contingencyBuffer: this.contingencyBuffer
    });
    
    this.grossMarginPercent = marginResult.grossMarginPercent;
    this.contributionMargin = marginResult.netProfit;
    this.breakEvenValue = totalCost;
    this.marginThresholdStatus = marginResult.marginStatus;
    
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    // Fallback to simple calculation if AI fails
    const totalCost = this.trainerCost + this.labCost + this.logisticsCost + this.contentCost + this.contingencyBuffer;
    this.grossMarginPercent = this.totalOrderValue > 0 
      ? ((this.totalOrderValue - totalCost) / this.totalOrderValue) * 100 
      : 0;
    this.contributionMargin = this.totalOrderValue - totalCost;
    this.breakEvenValue = totalCost;
    
    if (this.grossMarginPercent < 10) {
      this.marginThresholdStatus = 'Below Threshold';
    } else if (this.grossMarginPercent > 15) {
      this.marginThresholdStatus = 'Above Threshold';
    } else {
      this.marginThresholdStatus = 'At Threshold';
    }
    
    this.updatedAt = Date.now();
    next();
  }
});

export default mongoose.model('Deal', dealSchema);
