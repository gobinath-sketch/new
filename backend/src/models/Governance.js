import mongoose from 'mongoose';

const auditTrailSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    required: true
  },
  entityId: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now,
    immutable: true
  }
});

const governanceSchema = new mongoose.Schema({
  dealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program'
  },
  lossMakingProjectFlag: {
    type: Boolean,
    default: false
  },
  marginLockFlag: {
    type: Boolean,
    default: false
  },
  directorApprovalRequired: {
    type: Boolean,
    default: false
  },
  fraudAlertType: {
    type: String,
    enum: ['None', 'Duplicate Invoice', 'Overbilling', 'Suspicious Activity', 'Data Anomaly'],
    default: 'None'
  },
  duplicateDetectionLog: {
    type: mongoose.Schema.Types.Mixed
  },
  decisionNotes: {
    type: String
  },
  approvalHistory: [{
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvalStatus: {
      type: String,
      enum: ['Approved', 'Rejected', 'Pending']
    },
    notes: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export const AuditTrail = mongoose.model('AuditTrail', auditTrailSchema);
export default mongoose.model('Governance', governanceSchema);
