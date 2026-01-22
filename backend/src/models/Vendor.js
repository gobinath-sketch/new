import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  vendorType: {
    type: String,
    enum: ['Individual', 'Company'],
    required: true
  },
  vendorName: {
    type: String,
    required: true
  },
  aadhaarNumber: {
    type: String
  },
  panNumber: {
    type: String,
    required: true
  },
  gstNumber: {
    type: String
  },
  bankAccountNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Bank account number should be 9-18 digits
        return /^[0-9]{9,18}$/.test(v);
      },
      message: 'Bank account number must be 9-18 digits'
    }
  },
  ifscCode: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // IFSC code format: 4 letters + 0 + 6 alphanumeric (11 characters total)
        return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.toUpperCase());
      },
      message: 'IFSC code must be 11 characters in format: AAAA0XXXXX (e.g., HDFC0001234)'
    }
  },
  bankName: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Bank name must be at least 2 characters'],
    maxlength: [100, 'Bank name cannot exceed 100 characters']
  },
  address: {
    type: String,
    required: true
  },
  contactPersonName: {
    type: [String],
    required: true,
    default: []
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: [String],
    required: true,
    default: [],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0 && v.some(p => p && p.trim() !== '');
      },
      message: 'At least one contact number is required'
    }
  },
  bankBranchName: {
    type: String,
    trim: true,
    maxlength: [100, 'Bank branch name cannot exceed 100 characters']
  },
  accountType: {
    type: String,
    enum: ['Savings Account', 'Current Account', 'Salary Account', 'Fixed Deposit Account', 'Recurring Deposit Account', 'NRI Account'],
    default: 'Savings Account'
  },
  ndaUpload: {
    type: String
  },
  agreementUpload: {
    type: String
  },
  certificationUpload: {
    type: String
  },
  documentExpiryDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Blacklisted'],
    default: 'Active'
  },
  blacklistFlag: {
    type: Boolean,
    default: false
  },
  vendorRiskScore: {
    type: Number,
    default: 0
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

vendorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Handle backward compatibility: convert string phone to array
  if (this.phone && typeof this.phone === 'string') {
    this.phone = [this.phone];
  }
  
  // Ensure phone is an array
  if (!Array.isArray(this.phone)) {
    this.phone = this.phone ? [this.phone] : [];
  }
  
  next();
});

export default mongoose.model('Vendor', vendorSchema);
