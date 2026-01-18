import express from 'express';
import DealRequest from '../models/DealRequest.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { generateDealRequestId } from '../utils/generators.js';
import SystemEventLog from '../models/SystemEventLog.js';

const router = express.Router();

// Create deal request (Business Head only)
router.post('/', authenticate, authorize('Business Head'), async (req, res) => {
  try {
    const dealId = await generateDealRequestId(DealRequest);
    const dealRequest = new DealRequest({
      ...req.body,
      dealId,
      createdBy: req.user._id
    });
    await dealRequest.save();

    await SystemEventLog.create({
      eventType: 'Deal Created',
      entityType: 'DealRequest',
      entityId: dealRequest._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      action: 'Created deal request',
      metadata: { dealId: dealRequest.dealId, clientName: dealRequest.clientName }
    });

    res.status(201).json(dealRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all deal requests (view by Ops, Finance, Director, Business Head)
router.get('/', authenticate, authorize('Operations Manager', 'Business Head', 'Finance Manager', 'Director'), async (req, res) => {
  try {
    const dealRequests = await DealRequest.find()
      .populate('createdBy', 'name email')
      .populate('opsAcknowledgedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(dealRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get deal request by ID
router.get('/:id', authenticate, authorize('Operations Manager', 'Business Head', 'Finance Manager', 'Director'), async (req, res) => {
  try {
    const dealRequest = await DealRequest.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('opsAcknowledgedBy', 'name email');
    if (!dealRequest) {
      return res.status(404).json({ error: 'Deal request not found' });
    }
    res.json(dealRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Business Head approve deal
router.put('/:id/approve', authenticate, authorize('Business Head'), async (req, res) => {
  try {
    const dealRequest = await DealRequest.findById(req.params.id);
    if (!dealRequest) {
      return res.status(404).json({ error: 'Deal request not found' });
    }

    // Use AI to decide if deal should be approved
    const { shouldApproveDealWithAI } = await import('../utils/aiDecisionEngine.js');
    const approvalDecision = await shouldApproveDealWithAI({
      clientName: dealRequest.clientName,
      offeringType: dealRequest.offeringType,
      expectedRevenue: dealRequest.expectedRevenue,
      expectedStartDate: dealRequest.expectedStartDate,
      expectedEndDate: dealRequest.expectedEndDate,
      marginStatus: dealRequest.marginStatus
    });

    if (!approvalDecision.shouldApprove) {
      return res.status(400).json({ 
        error: 'Deal not approved by AI', 
        reason: approvalDecision.reason,
        riskLevel: approvalDecision.riskLevel,
        recommendations: approvalDecision.recommendations
      });
    }

    // Check if already approved (idempotency)
    if (dealRequest.dealApprovalStatus === 'Approved') {
      // Already approved, check if PO exists
      const { autoGeneratePOFromDeal } = await import('../utils/autoGeneration.js');
      try {
        await autoGeneratePOFromDeal(dealRequest, req.user._id, req.user.role);
      } catch (poError) {
        // PO might already exist, that's fine
        console.error('PO generation check:', poError.message);
      }
      return res.json(dealRequest);
    }
    
    dealRequest.dealApprovalStatus = 'Approved';
    await dealRequest.save();

    // Auto-generate PO status
    try {
      const { autoGeneratePOFromDeal } = await import('../utils/autoGeneration.js');
      const poStatus = await autoGeneratePOFromDeal(dealRequest, req.user._id, req.user.role);
      if (!poStatus) {
        console.error('PO Status auto-generation returned null');
      } else {
        // Verify PO was saved
        const InternalPOStatus = (await import('../models/InternalPOStatus.js')).default;
        const verifyPO = await InternalPOStatus.findById(poStatus._id);
        if (!verifyPO) {
          console.error('PO Status not found after creation');
        }
      }
    } catch (poError) {
      // Log but don't fail deal approval
      console.error('Error auto-generating PO status:', poError.message, poError.stack);
      // Still continue - deal approval should succeed
    }

    await SystemEventLog.create({
      eventType: 'Deal Approved',
      entityType: 'DealRequest',
      entityId: dealRequest._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      action: 'Approved deal request',
      downstreamAction: 'Auto-generate Internal PO',
      metadata: { dealId: dealRequest.dealId }
    });

    res.json(dealRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ops acknowledge deal request
router.put('/:id/acknowledge', authenticate, authorize('Operations Manager'), async (req, res) => {
  try {
    const dealRequest = await DealRequest.findById(req.params.id);
    if (!dealRequest) {
      return res.status(404).json({ error: 'Deal request not found' });
    }

    if (req.body.action === 'acknowledge') {
      dealRequest.opsAcknowledgementStatus = 'Acknowledged';
      dealRequest.opsAcknowledgedAt = new Date();
      dealRequest.opsAcknowledgedBy = req.user._id;
    } else if (req.body.action === 'clarification') {
      dealRequest.opsAcknowledgementStatus = 'Clarification Requested';
      dealRequest.opsClarificationComment = req.body.comment;
    }

    await dealRequest.save();

    await SystemEventLog.create({
      eventType: 'Deal Acknowledged',
      entityType: 'DealRequest',
      entityId: dealRequest._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      action: req.body.action === 'acknowledge' ? 'Acknowledged deal' : 'Requested clarification',
      metadata: { dealId: dealRequest.dealId }
    });

    res.json(dealRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Finance update readiness status
router.put('/:id/finance-readiness', authenticate, authorize('Finance Manager'), async (req, res) => {
  try {
    const dealRequest = await DealRequest.findById(req.params.id);
    if (!dealRequest) {
      return res.status(404).json({ error: 'Deal request not found' });
    }

    dealRequest.financeReadinessStatus = req.body.status;
    dealRequest.financeReadinessAt = new Date();
    await dealRequest.save();

    res.json(dealRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
