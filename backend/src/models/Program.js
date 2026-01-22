import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionDate: {
    type: Date,
    required: true
  },
  sessionDuration: {
    type: Number,
    required: true
  },
  attendanceMode: {
    type: String,
    enum: ['QR', 'Manual'],
    default: 'Manual'
  },
  attendanceRecords: [{
    participantName: String,
    attendanceStatus: {
      type: String,
      enum: ['Present', 'Absent', 'Late'],
      default: 'Absent'
    },
    timestamp: Date
  }]
});

const programSchema = new mongoose.Schema({
  // Training Opportunities
  trainingOpportunity: {
    type: String,
    enum: ['Training', 'Vouchers', 'Resource Support', 'Lab support', 'Content development', 'Project Support'],
    required: true
  },
  // Training Sectors
  trainingSector: {
    type: String,
    enum: ['Corporate', 'academics', 'university', 'college', 'school'],
    required: true
  },
  // Link to Opportunity (for Adhoc ID)
  opportunityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity'
  },
  // Training Status
  trainingStatus: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'On Hold', 'Approved', 'Rejected'],
    default: 'Scheduled'
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
  // Training Supporter
  trainingSupporter: {
    type: String,
    enum: ['GKT', 'GKCS', 'MCT'],
    required: true
  },
  // Sales
  sales: {
    type: String
  },
  // Training Year
  trainingYear: {
    type: Number,
    required: true
  },
  // Training Month
  trainingMonth: {
    type: String,
    enum: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    required: true
  },
  // Adhoc ID
  adhocId: {
    type: String
  },
  // Billing Client
  billingClient: {
    type: String,
    required: true
  },
  // End Client
  endClient: {
    type: String,
    required: true
  },
  // Course Code
  courseCode: {
    type: String,
    required: true
  },
  // Course Name
  courseName: {
    type: String,
    required: true
  },
  // Technology
  technology: {
    type: String,
    required: true
  },
  // Number of Participants
  numberOfParticipants: {
    type: Number,
    required: true
  },
  // Attendance
  attendance: {
    type: Number,
    default: 0
  },
  // Start Date
  startDate: {
    type: Date,
    required: true
  },
  // End Date
  endDate: {
    type: Date,
    required: true
  },
  // Number of Days
  numberOfDays: {
    type: Number,
    required: true
  },
  // Location
  location: {
    type: String,
    enum: ['Online', 'Classroom', 'Hybrid'],
    required: true
  },
  // Training Location (if Classroom/Hybrid)
  trainingLocation: {
    type: String
  },
  // Trainer (can be multiple)
  trainers: [{
    type: String,
    required: true
  }],
  // TOV (Billing Amount)
  tov: {
    type: Number,
    required: true
  },
  // PO
  po: {
    type: String
  },
  // PO Date
  poDate: {
    type: Date
  },
  // Invoice Number
  invoiceNumber: {
    type: String
  },
  // Invoice Date
  invoiceDate: {
    type: Date
  },
  // Payment Terms
  paymentTerms: {
    type: String
  },
  // Payment Date
  paymentDate: {
    type: Date
  },
  // Trainer PO Values
  trainerPOValues: {
    type: Number,
    default: 0
  },
  // Lab PO Value
  labPOValue: {
    type: Number,
    default: 0
  },
  // Course Material
  courseMaterial: {
    type: Number,
    default: 0
  },
  // Royalty Charges
  royaltyCharges: {
    type: Number,
    default: 0
  },
  // Venue
  venue: {
    type: String
  },
  // Travel Charges
  travelCharges: {
    type: Number,
    default: 0
  },
  // Accommodation
  accommodation: {
    type: Number,
    default: 0
  },
  // Per Diem
  perDiem: {
    type: Number,
    default: 0
  },
  // Local Conveyance
  localConveyance: {
    type: Number,
    default: 0
  },
  // Marketing Charges (percentage or amount)
  marketingChargesPercent: {
    type: Number
  },
  marketingChargesAmount: {
    type: Number,
    default: 0
  },
  // Contingency (percentage or amount)
  contingencyPercent: {
    type: Number
  },
  contingencyAmount: {
    type: Number,
    default: 0
  },
  // Final GP (Gross Profit) - calculated
  finalGP: {
    type: Number,
    default: 0
  },
  gpPercent: {
    type: Number,
    default: 0
  },
  // Legacy fields for backward compatibility
  programName: {
    type: String
  },
  programCode: {
    type: String,
    unique: true,
    sparse: true
  },
  sacCode: {
    type: String
  },
  clientName: {
    type: String
  },
  batchName: {
    type: String
  },
  batchCapacity: {
    type: Number
  },
  deliveryMode: {
    type: String,
    enum: ['Onsite', 'Virtual', 'Hybrid']
  },
  primaryTrainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  backupTrainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  labPlatformName: {
    type: String
  },
  sessionDates: [sessionSchema],
  autoHolidayRescheduleFlag: {
    type: Boolean,
    default: false
  },
  trainerSignOff: {
    type: Boolean,
    default: false
  },
  trainerSignOffDate: {
    type: Date
  },
  clientSignOff: {
    type: Boolean,
    default: false
  },
  clientSignOffDate: {
    type: Date
  },
  deliveryStatus: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'On Hold'],
    default: 'Scheduled'
  },
  deviationReason: {
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

programSchema.pre('save', function(next) {
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
  
  // Calculate Final GP (Gross Profit)
  // GP = TOV - (Trainer PO + Lab PO + Course Material Royalty + Training Charges + Accommodation + Per Diem + Local Conveyance + Marketing Charges + Contingency)
  if (this.tov && this.tov > 0) {
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
  
  // Set legacy fields for backward compatibility
  if (!this.programName && this.courseName) {
    this.programName = this.courseName;
  }
  if (!this.clientName && this.endClient) {
    this.clientName = this.endClient;
  }
  if (!this.deliveryStatus && this.trainingStatus) {
    this.deliveryStatus = this.trainingStatus;
  }
  
  next();
});

export default mongoose.model('Program', programSchema);
