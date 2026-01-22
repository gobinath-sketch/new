import mongoose from 'mongoose';

const bocSchema = new mongoose.Schema({
  bocNumber: {
    type: String,
    unique: true,
    required: true
  },
  purchaseOfferId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOffer',
    required: true
  },
  quotationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
  bocDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  confirmedValue: {
    type: Number,
    required: true
  },
  documentUpload: {
    type: String // File path or URL
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedAt: {
    type: Date
  },
  sentToOperations: {
    type: Boolean,
    default: false
  },
  sentToFinance: {
    type: Boolean,
    default: false
  },
  sentToOperationsAt: {
    type: Date
  },
  sentToFinanceAt: {
    type: Date
  },
  convertedToInvoice: {
    type: Boolean,
    default: false
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  status: {
    type: String,
    enum: ['Draft', 'Uploaded', 'Sent to Operations', 'Sent to Finance', 'Invoice Generated', 'Completed'],
    default: 'Draft'
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

bocSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('BOC', bocSchema);
