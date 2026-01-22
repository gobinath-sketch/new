import mongoose from 'mongoose';

const receivableSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: false
  },
  adhocId: {
    type: String,
    required: false
  },
  clientName: {
    type: String,
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  invoiceAmount: {
    type: Number,
    required: true
  },
  taxableAmount: {
    type: Number,
    default: 0
  },
  gstAmount: {
    type: Number,
    default: 0
  },
  tdsAmount: {
    type: Number,
    default: 0
  },
  paymentTerms: {
    type: Number,
    required: true,
    default: 30
  },
  dueDate: {
    type: Date,
    required: true
  },
  lateFeePerDay: {
    type: Number,
    default: 0
  },
  agingBucket: {
    type: String,
    enum: ['Current', '1-30 Days', '31-60 Days', '61-90 Days', 'Over 90 Days'],
    default: 'Current'
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
    enum: ['Pending', 'Partially Paid', 'Paid', 'Overdue', 'Written Off'],
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

receivableSchema.pre('save', function (next) {
  this.outstandingAmount = this.invoiceAmount - this.paidAmount;

  if (this.outstandingAmount === 0) {
    this.status = 'Paid';
  } else if (this.paidAmount > 0) {
    this.status = 'Partially Paid';
  }

  const daysOverdue = Math.floor((Date.now() - this.dueDate) / (1000 * 60 * 60 * 24));
  if (daysOverdue > 90) {
    this.agingBucket = 'Over 90 Days';
  } else if (daysOverdue > 60) {
    this.agingBucket = '61-90 Days';
  } else if (daysOverdue > 30) {
    this.agingBucket = '31-60 Days';
  } else if (daysOverdue > 0) {
    this.agingBucket = '1-30 Days';
  } else {
    this.agingBucket = 'Current';
  }

  if (daysOverdue > 0 && this.status !== 'Paid') {
    this.status = 'Overdue';
  }

  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Receivable', receivableSchema);
