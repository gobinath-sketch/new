import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },
  materialName: {
    type: String,
    required: true
  },
  quantityRequired: {
    type: Number,
    required: true
  },
  availableStock: {
    type: Number,
    default: 0
  },
  courierPartner: {
    type: String,
    enum: ['BlueDart', 'FedEx', 'DTDC', 'Delhivery', 'India Post', 'Other']
  },
  materialStatus: {
    type: String,
    enum: ['Pending', 'Ordered', 'In Transit', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  dispatchDate: {
    type: Date
  },
  trackingNumber: {
    type: String
  },
  proofOfDeliveryUpload: {
    type: String
  },
  materialCost: {
    type: Number,
    default: 0
  },
  costAllocationReference: {
    type: String
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

materialSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Material', materialSchema);
