import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['opportunity_created', 'program_created', 'opportunity_qualified', 'opportunity_sent_to_delivery', 'opportunity_converted', 'opportunity_lost'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    enum: ['Opportunity', 'Program', 'Deal'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

// Index for efficient querying
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ role: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
