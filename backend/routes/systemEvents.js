import express from 'express';
import SystemEventLog from '../models/SystemEventLog.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get system events (all roles - read only, filtered by relevance)
router.get('/', authenticate, authorize('Operations Manager', 'Business Head', 'Finance Manager', 'Director'), async (req, res) => {
  try {
    const { entityType, entityId, eventType, limit = 50 } = req.query;
    
    const filter = {};
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;
    if (eventType) filter.eventType = eventType;
    
    // Filter by user role relevance
    if (req.user.role === 'Operations Manager') {
      filter.$or = [
        { eventType: { $in: ['Deal Acknowledged', 'PO Auto-Generated'] } },
        { userRole: 'Operations Manager' }
      ];
    } else if (req.user.role === 'Business Head') {
      filter.$or = [
        { eventType: { $in: ['Deal Created', 'Deal Approved'] } },
        { userRole: 'Business Head' }
      ];
    } else if (req.user.role === 'Finance Manager') {
      filter.$or = [
        { eventType: { $in: ['TDS Calculated', 'Payment Processed', 'Invoice Auto-Generated'] } },
        { userRole: 'Finance Manager' }
      ];
    }
    // Director sees all
    
    const events = await SystemEventLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get events for specific entity
router.get('/entity/:entityType/:entityId', authenticate, authorize('Operations Manager', 'Business Head', 'Finance Manager', 'Director'), async (req, res) => {
  try {
    const events = await SystemEventLog.find({
      entityType: req.params.entityType,
      entityId: req.params.entityId
    })
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 });
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
