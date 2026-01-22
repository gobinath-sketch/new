import mongoose from 'mongoose';

const taxEngineSchema = new mongoose.Schema({
  payableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payable',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  vendorType: {
    type: String,
    enum: ['Individual', 'Company', 'HUF', 'Firm', 'LLP'],
    required: true
  },
  natureOfService: {
    type: String,
    enum: ['Contractor', 'Professional Services', 'Technical Services', 'Call Centre Services', 'Other'],
    required: true
  },
  tdsSection: {
    type: String,
    enum: ['194C', '194J', 'None'],
    required: true
  },
  payeeType: {
    type: String,
    enum: ['Individual/HUF', 'Company/Firm/LLP'],
    required: true
  },
  applicableTdsPercent: {
    type: Number,
    required: true,
    default: 0
  },
  paymentAmount: {
    type: Number,
    required: true
  },
  thresholdCheckResult: {
    type: String,
    enum: ['Above Threshold', 'Below Threshold'],
    required: true
  },
  tdsAmount: {
    type: Number,
    required: true,
    default: 0
  },
  netPayableAmount: {
    type: Number,
    required: true
  },
  panNumber: {
    type: String
  },
  panAvailabilityFlag: {
    type: Boolean,
    default: false
  },
  panNotProvidedTdsPercent: {
    type: Number,
    default: 0
  },
  complianceStatus: {
    type: String,
    enum: ['Compliant', 'Non-Compliant', 'Pending PAN', 'Director Override'],
    default: 'Pending PAN'
  },
  directorOverrideFlag: {
    type: Boolean,
    default: false
  },
  directorOverrideBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  directorOverrideAt: {
    type: Date
  },
  autoCalculatedAt: {
    type: Date,
    default: Date.now
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

taxEngineSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('TaxEngine', taxEngineSchema);
