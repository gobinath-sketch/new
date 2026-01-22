import mongoose from 'mongoose';

const dealRequestSchema = new mongoose.Schema({
  dealId: {
    type: String,
    unique: true,
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
  offeringType: {
    type: String,
    enum: ['Training', 'Product', 'Consulting'],
    required: true
  },
  expectedStartDate: {
    type: Date,
    required: true
  },
  expectedEndDate: {
    type: Date,
    required: true
  },
  expectedRevenue: {
    type: Number,
    required: true
  },
  marginStatus: {
    type: String,
    enum: ['Above Threshold', 'Below Threshold', 'At Threshold'],
    default: 'At Threshold'
  },
  dealApprovalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  opsAcknowledgementStatus: {
    type: String,
    enum: ['Pending', 'Acknowledged', 'Clarification Requested'],
    default: 'Pending'
  },
  opsAcknowledgedAt: {
    type: Date
  },
  opsAcknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  opsClarificationComment: {
    type: String
  },
  financeReadinessStatus: {
    type: String,
    enum: ['Pending', 'Ready', 'Not Ready'],
    default: 'Pending'
  },
  financeReadinessAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

dealRequestSchema.pre('save', async function(next) {
  try {
    // Use AI for margin status calculation
    const { calculateMarginWithAI } = await import('../utils/aiDecisionEngine.js');
    const marginResult = await calculateMarginWithAI(this.expectedRevenue, {
      totalCost: 0, // Cost data not available at deal request stage
      trainerCost: 0,
      labCost: 0,
      logisticsCost: 0,
      contentCost: 0,
      contingencyBuffer: 0
    });
    
    this.marginStatus = marginResult.marginStatus;
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    // Fallback to simple calculation if AI fails
    if (this.expectedRevenue > 0) {
      if (this.expectedRevenue < 100000) {
        this.marginStatus = 'Below Threshold';
      } else if (this.expectedRevenue > 500000) {
        this.marginStatus = 'Above Threshold';
      } else {
        this.marginStatus = 'At Threshold';
      }
    }
    this.updatedAt = Date.now();
    next();
  }
});

export default mongoose.model('DealRequest', dealRequestSchema);
