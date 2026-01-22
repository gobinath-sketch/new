import express from 'express';
import Deal from '../models/Deal.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { generateDealId } from '../utils/generators.js';
import { AuditTrail } from '../models/Governance.js';
import Governance from '../models/Governance.js';

const router = express.Router();

router.get('/', authenticate, authorize('Business Head', 'Director', 'Sales Executive', 'Sales Manager', 'Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    const deals = await Deal.find().sort({ createdAt: -1 });
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download Deal Summary PDF (must be before /:id route)
router.get('/:id/download', authenticate, authorize('Business Head', 'Director'), async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (!deal.dealId || deal.totalOrderValue === undefined) {
      return res.status(400).json({ error: 'Deal is incomplete and cannot be downloaded' });
    }

    const { generateDealPDF } = await import('../utils/pdfGenerator.js');
    const pdfBuffer = await generateDealPDF(deal.toObject(), req.user.role);

    const SystemEventLog = (await import('../models/SystemEventLog.js')).default;
    await SystemEventLog.create({
      eventType: 'Document Downloaded',
      entityType: 'Deal',
      entityId: deal._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      action: 'Downloaded deal summary PDF'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Deal-${deal.dealId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, authorize('Business Head', 'Director', 'Sales Executive', 'Sales Manager', 'Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('Business Head', 'Operations Manager', 'Sales Executive', 'Sales Manager'), async (req, res) => {
  try {
    const dealId = await generateDealId(Deal);
    const deal = new Deal({ ...req.body, dealId });
    await deal.save();

    // If created from Opportunity, link it
    if (req.body.opportunityId) {
      const Opportunity = (await import('../models/Opportunity.js')).default;
      const opportunity = await Opportunity.findById(req.body.opportunityId);
      if (opportunity && ['Qualified', 'Sent to Delivery'].includes(opportunity.opportunityStatus)) {
        opportunity.opportunityStatus = 'Converted to Deal';
        opportunity.convertedToDealId = deal._id;
        opportunity.convertedAt = new Date();
        await opportunity.save();

        // Create notification for conversion
        const { createNotification } = await import('../utils/notificationService.js');
        await createNotification(
          'opportunity_converted',
          'Opportunity',
          opportunity._id,
          req.user._id,
          { adhocId: opportunity.opportunityId }
        );
      }
    }

    // Use AI for risk assessment with Fallback
    let riskAssessment = { riskLevel: 'Medium', riskScore: 50, reasoning: 'AI Service Unavailable - Defaulting to Medium' };
    try {
      const { assessRiskWithAI } = await import('../utils/aiDecisionEngine.js');
      riskAssessment = await assessRiskWithAI('Deal', {
        dealId: deal.dealId,
        totalOrderValue: deal.totalOrderValue,
        grossMarginPercent: deal.grossMarginPercent,
        marginThresholdStatus: deal.marginThresholdStatus
      });
    } catch (aiError) {
      // AI service unavailable, proceeding with default risk assessment (Safe Mode)
    }

    const governance = new Governance({
      dealId: deal._id,
      lossMakingProjectFlag: riskAssessment.riskLevel === 'High' || deal.marginThresholdStatus === 'Below Threshold',
      directorApprovalRequired: riskAssessment.riskLevel === 'High' || deal.marginThresholdStatus === 'Below Threshold'
    });
    await governance.save();

    await AuditTrail.create({
      action: 'Deal Created',
      entityType: 'Deal',
      entityId: deal._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: req.body
    });

    res.status(201).json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize('Business Head'), async (req, res) => {
  try {
    const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const governance = await Governance.findOne({ dealId: deal._id });
    if (governance) {
      // Use AI for risk assessment with Fallback
      let riskAssessment = { riskLevel: 'Medium' };
      try {
        const { assessRiskWithAI } = await import('../utils/aiDecisionEngine.js');
        riskAssessment = await assessRiskWithAI('Deal', {
          dealId: deal.dealId,
          totalOrderValue: deal.totalOrderValue,
          grossMarginPercent: deal.grossMarginPercent,
          marginThresholdStatus: deal.marginThresholdStatus
        });
      } catch (aiError) {
        // AI service unavailable, proceeding with default (Safe Mode)
      }

      governance.lossMakingProjectFlag = riskAssessment.riskLevel === 'High' || deal.marginThresholdStatus === 'Below Threshold';
      governance.directorApprovalRequired = riskAssessment.riskLevel === 'High' || deal.marginThresholdStatus === 'Below Threshold';
      await governance.save();
    }

    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/approve', authenticate, authorize('Director'), async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    deal.approvalStatus = 'Approved';
    deal.approvalTimestamp = new Date();
    deal.approvedBy = req.user._id;
    await deal.save();

    const governance = await Governance.findOne({ dealId: deal._id });
    if (governance) {
      governance.approvalHistory.push({
        approvedBy: req.user._id,
        approvalStatus: 'Approved',
        notes: req.body.notes || '',
        timestamp: new Date()
      });
      await governance.save();
    }

    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
