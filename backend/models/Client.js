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
    default: [],
    validate: {
      validator: function (v) {
        return v.every(num => /^\d{10}$/.test(num));
      },
      message: 'Phone numbers must be exactly 10 digits'
    }
  },
  emailId: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  linkedinProfile: {
    type: String
  },
  hasReportingManager: {
    type: Boolean,
    default: false
  },
  reportingManagerDesignation: {
    type: String
  },
  reportingManagerContactNumber: {
    type: String,
    validate: {
      validator: function (v) {
        if (!v) return true; // Optional
        return /^\d{10}$/.test(v);
      },
      message: 'Reporting Manager phone number must be exactly 10 digits'
    }
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

clientSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Client', clientSchema);
