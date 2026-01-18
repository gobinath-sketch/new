import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true
  },
  trainingSector: {
    type: String,
    enum: ['Corporate', 'academics', 'university', 'college', 'school'],
    required: true
  },
  contactPersonName: {
    type: [String],
    required: true,
    default: []
  },
  designation: {
    type: [String],
    required: true,
    default: []
  },
  contactNumber: {
    type: [String],
    required: true,
    default: []
  },
  emailId: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  hasReportingManager: {
    type: Boolean,
    default: false
  },
  reportingManagerDesignation: {
    type: String
  },
  reportingManagerContactNumber: {
    type: String
  },
  reportingManagerEmailId: {
    type: String
  },
  reportingManagerLocation: {
    type: String
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

clientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Client', clientSchema);
