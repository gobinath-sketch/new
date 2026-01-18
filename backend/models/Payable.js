import mongoose from 'mongoose';

const payableSchema = new mongoose.Schema({
  purchaseOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  vendorName: {
    type: String,
    required: true
  },
  vendorPayoutReference: {
    type: String,
    unique: true,
    required: true
  },
  approvedCost: {
    type: Number,
    required: true
  },
  adjustedPayableAmount: {
    type: Number,
    required: true
  },
  paymentTerms: {
    type: Number,
    default: 30
  },
  paymentMode: {
    type: String,
    enum: ['NEFT', 'RTGS', 'IMPS', 'UPI', 'Cheque', 'Cash', 'Bank Transfer'],
    default: 'NEFT'
  },
  dueDate: {
    type: Date,
    required: true
  },
  vendorPayoutDate: {
    type: Date
  },
  holdFlag: {
    type: Boolean,
    default: false
  },
  releaseFlag: {
    type: Boolean,
    default: false
  },
  bankStatementUpload: {
    type: String
  },
  reconciliationStatus: {
    type: String,
    enum: ['Pending', 'Reconciled', 'Discrepancy'],
    default: 'Pending'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  outstandingAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'On Hold', 'Released', 'Paid', 'Cancelled'],
    default: 'Pending'
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

payableSchema.pre('save', function(next) {
  this.outstandingAmount = this.adjustedPayableAmount - this.paidAmount;
  
  if (this.holdFlag) {
    this.status = 'On Hold';
  } else if (this.releaseFlag && this.outstandingAmount === 0) {
    this.status = 'Paid';
  } else if (this.releaseFlag) {
    this.status = 'Released';
  }
  
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Payable', payableSchema);
