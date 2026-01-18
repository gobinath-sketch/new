import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema({
  quotationNumber: {
    type: String,
    unique: true,
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
  quotationDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  opportunityType: {
    type: String,
    enum: ['Training', 'Vouchers', 'Resource Support', 'Lab support', 'Content development', 'Project Support'],
    required: true
  },
  serviceDescription: {
    type: String,
    required: true
  },
  totalValue: {
    type: Number,
    required: true
  },
  termsAndConditions: {
    type: String
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent to Client', 'Under Review', 'Accepted', 'Rejected', 'Expired'],
    default: 'Draft'
  },
  sentToSalesTeam: {
    type: Boolean,
    default: false
  },
  sentToSalesTeamAt: {
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

quotationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Quotation', quotationSchema);
