import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema({
  opportunityId: {
    type: String,
    unique: true,
    required: true
  },
  clientCompanyName: {
    type: String,
    required: function() {
      return !this.billingClient; // Required only if new form fields not present
    }
  },
  clientContactName: {
    type: String,
    required: function() {
      return !this.billingClient; // Required only if new form fields not present
    }
  },
  clientEmail: {
    type: String,
    required: function() {
      return !this.billingClient; // Required only if new form fields not present
    }
  },
  clientPhone: {
    type: String,
    required: function() {
      return !this.billingClient; // Required only if new form fields not present
    }
  },
  designation: {
    type: String,
    required: function() {
      return !this.billingClient; // Required only if new form fields not present
    }
  },
  location: {
    type: String,
    required: function() {
      return !this.location && !this.trainingOpportunity; // Required only if new form fields not present
    }
  },
  opportunityType: {
    type: String,
    enum: ['Training', 'Exam Voucher', 'Content Development / Project Work', 'Consultant (Resource Support)', 'Lab Support', 'Product', 'Training', 'Vouchers', 'Resource Support', 'Lab support', 'Content development', 'Project Support'],
    required: function() {
      return !this.trainingOpportunity; // Required only if new form fields not present
    }
  },
  serviceCategory: {
    type: String,
    enum: ['Corporate', 'Academic', 'School', 'Government', 'Individual', 'academics', 'university', 'college'],
    required: function() {
      return !this.trainingSector; // Required only if new form fields not present
    }
  },
  // Additional fields for Sales Executive opportunity creation
  trainingOpportunity: {
    type: String,
    enum: ['Training', 'Vouchers', 'Resource Support', 'Lab support', 'Content development', 'Project Support']
  },
  trainingSector: {
    type: String,
    enum: ['Corporate', 'academics', 'university', 'college', 'school']
  },
  trainingStatus: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'On Hold'],
    default: 'Scheduled'
  },
  trainingSupporter: {
    type: String,
    enum: ['GKT', 'GKCS', 'MCT']
  },
  sales: {
    type: String
  },
  trainingYear: {
    type: Number
  },
  trainingMonth: {
    type: String,
    enum: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  },
  adhocId: {
    type: String
  },
  billingClient: {
    type: String
  },
  endClient: {
    type: String
  },
  courseCode: {
    type: String
  },
  courseName: {
    type: String
  },
  technology: {
    type: String
  },
  numberOfParticipants: {
    type: Number
  },
  attendance: {
    type: Number,
    default: 0
  },
  numberOfDays: {
    type: Number
  },
  location: {
    type: String,
    enum: ['Online', 'Classroom', 'Hybrid', 'Classroom / Hybrid']
  },
  trainingLocation: {
    type: String
  },
  trainers: [{
    type: String
  }],
  tov: {
    type: Number
  },
  po: {
    type: String
  },
  poDate: {
    type: Date
  },
  invoiceNumber: {
    type: String
  },
  invoiceDate: {
    type: Date
  },
  paymentTerms: {
    type: String
  },
  paymentDate: {
    type: Date
  },
  trainerPOValues: {
    type: Number,
    default: 0
  },
  labPOValue: {
    type: Number,
    default: 0
  },
  courseMaterial: {
    type: Number,
    default: 0
  },
  royaltyCharges: {
    type: Number,
    default: 0
  },
  venue: {
    type: String
  },
  travelCharges: {
    type: Number,
    default: 0
  },
  accommodation: {
    type: Number,
    default: 0
  },
  perDiem: {
    type: Number,
    default: 0
  },
  localConveyance: {
    type: Number,
    default: 0
  },
  marketingChargesPercent: {
    type: Number
  },
  marketingChargesAmount: {
    type: Number,
    default: 0
  },
  contingencyPercent: {
    type: Number
  },
  contingencyAmount: {
    type: Number,
    default: 0
  },
  finalGP: {
    type: Number,
    default: 0
  },
  gpPercent: {
    type: Number,
    default: 0
  },
  expectedParticipants: {
    type: Number,
    required: function() {
      return !this.numberOfParticipants && !this.noOfIds; // Required only if new form fields not present
    }
  },
  expectedDuration: {
    type: Number, // Days
    required: function() {
      return !this.numberOfDays; // Required only if new form fields not present
    }
  },
  expectedStartDate: {
    type: Date,
    required: function() {
      return !this.startDate; // Required only if new form fields not present
    }
  },
  expectedEndDate: {
    type: Date
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  expectedCommercialValue: {
    type: Number,
    required: function() {
      return !this.tov; // Required only if new form fields not present
    }
  },
  clientPOUpload: {
    type: String // File path or URL
  },
  opportunityStatus: {
    type: String,
    enum: ['New', 'Qualified', 'Sent to Delivery', 'Converted to Deal', 'Lost', 'Approved', 'Rejected'],
    default: 'New'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  salesExecutiveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  salesManagerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  qualifiedAt: {
    type: Date
  },
  qualifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sentToDeliveryAt: {
    type: Date
  },
  sentToDeliveryBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  convertedToDealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  },
  convertedAt: {
    type: Date
  },
  lostReason: {
    type: String
  },
  lostAt: {
    type: Date
  },
  notes: {
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

opportunitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Number of days is now manual input - removed auto-calculation
  // Users will enter numberOfDays manually in the form
  
  // Calculate marketing charges if percentage is provided
  if (this.marketingChargesPercent && this.tov) {
    this.marketingChargesAmount = (this.tov * this.marketingChargesPercent) / 100;
  }
  
  // Calculate contingency if percentage is provided
  if (this.contingencyPercent && this.tov) {
    this.contingencyAmount = (this.tov * this.contingencyPercent) / 100;
  }
  
  // Calculate Final GP (Gross Profit) - only if tov exists
  if (this.tov !== undefined && this.tov !== null && this.tov > 0) {
    const totalCosts = (this.trainerPOValues || 0) + 
                      (this.labPOValue || 0) + 
                      (this.courseMaterial || 0) + 
                      (this.royaltyCharges || 0) + 
                      (this.travelCharges || 0) + 
                      (this.accommodation || 0) + 
                      (this.perDiem || 0) + 
                      (this.localConveyance || 0) + 
                      (this.marketingChargesAmount || 0) + 
                      (this.contingencyAmount || 0);
    this.finalGP = this.tov - totalCosts;
    // Calculate GP percentage
    this.gpPercent = (this.finalGP / this.tov) * 100;
  }
  
  next();
});

export default mongoose.model('Opportunity', opportunitySchema);
