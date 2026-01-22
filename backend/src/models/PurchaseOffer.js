import mongoose from 'mongoose';

const purchaseOfferSchema = new mongoose.Schema({
  offerNumber: {
    type: String,
    unique: true,
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
  offerDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  offerValue: {
    type: Number,
    required: true
  },
  terms: {
    type: String
  },
  status: {
    type: String,
    enum: ['Received', 'Under Review', 'Accepted', 'Rejected'],
    default: 'Received'
  },
  convertedToBOC: {
    type: Boolean,
    default: false
  },
  bocId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BOC'
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

purchaseOfferSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('PurchaseOffer', purchaseOfferSchema);
