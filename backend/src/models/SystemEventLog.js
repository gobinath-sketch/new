import mongoose from 'mongoose';

const systemEventLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: [
      'Deal Created',
      'Deal Approved',
      'Deal Acknowledged',
      'PO Auto-Generated',
      'Invoice Auto-Generated',
      'TDS Calculated',
      'Payment Processed',
      'Ledger Entry Posted',
      'Compliance Updated'
    ]
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
  action: {
    type: String,
    required: true
  },
  downstreamAction: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now,
    immutable: true
  }
});

systemEventLogSchema.index({ entityType: 1, entityId: 1 });
systemEventLogSchema.index({ userId: 1 });
systemEventLogSchema.index({ timestamp: -1 });

export default mongoose.model('SystemEventLog', systemEventLogSchema);
