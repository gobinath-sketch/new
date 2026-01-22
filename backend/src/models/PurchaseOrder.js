import mongoose from 'mongoose';

const purchaseOrderSchema = new mongoose.Schema({
  internalPONumber: {
    type: String,
    unique: true,
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program'
  },
  dealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  },
  approvedCost: {
    type: Number,
    required: true
  },
  costLockFlag: {
    type: Boolean,
    default: false
  },
  partialDeliveryFlag: {
    type: Boolean,
    default: false
  },
  adjustedPayableAmount: {
    type: Number,
    default: 0
  },
  vendorPerformanceScore: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Approved', 'Issued', 'Completed', 'Cancelled'],
    default: 'Draft'
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

purchaseOrderSchema.pre('save', function(next) {
  if (this.adjustedPayableAmount === 0) {
    this.adjustedPayableAmount = this.approvedCost;
  }
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);
