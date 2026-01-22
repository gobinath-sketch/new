import express from 'express';
import Governance from '../models/Governance.js';
import { AuditTrail } from '../models/Governance.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/audit-trail', authenticate, authorize('Director'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const audits = await AuditTrail.find()
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await AuditTrail.countDocuments();
    
    res.json({
      audits,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/risk-alerts', authenticate, authorize('Director'), async (req, res) => {
  try {
    const alerts = await Governance.find({
      $or: [
        { lossMakingProjectFlag: true },
        { fraudAlertType: { $ne: 'None' } },
        { directorApprovalRequired: true }
      ]
    }).populate('dealId programId').sort({ createdAt: -1 });
    
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, authorize('Director'), async (req, res) => {
  try {
    const governance = await Governance.findById(req.params.id).populate('dealId programId approvalHistory.approvedBy');
    if (!governance) {
      return res.status(404).json({ error: 'Governance record not found' });
    }
    res.json(governance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/approve', authenticate, authorize('Director'), async (req, res) => {
  try {
    const governance = await Governance.findById(req.params.id);
    if (!governance) {
      return res.status(404).json({ error: 'Governance record not found' });
    }
    
    const decision = req.body.decision || req.body.status || 'Approved';
    const approvalStatus = decision === 'Approve' ? 'Approved' : decision === 'Reject' ? 'Rejected' : 'Pending';
    
    governance.approvalHistory.push({
      approvedBy: req.user._id,
      approvalStatus: approvalStatus,
      notes: req.body.notes || req.body.decision || '',
      timestamp: new Date()
    });
    
    if (decision === 'Approve' || decision === 'Reject') {
      governance.directorApprovalRequired = false;
    }
    
    await governance.save();
    
    res.json(governance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
