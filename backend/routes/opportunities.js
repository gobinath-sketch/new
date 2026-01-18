import express from 'express';
import Opportunity from '../models/Opportunity.js';
import Deal from '../models/Deal.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { generateOpportunityId } from '../utils/generators.js';
import { AuditTrail } from '../models/Governance.js';

const router = express.Router();

// Get all opportunities (All roles can view all opportunities)
router.get('/', authenticate, authorize('Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    // All roles see all opportunities (including Sales Executive seeing Sales Manager opportunities and vice versa)
    let filter = {};

    const opportunities = await Opportunity.find(filter)
      .populate('salesExecutiveId', 'name email')
      .populate('salesManagerId', 'name email')
      .populate('qualifiedBy', 'name')
      .populate('sentToDeliveryBy', 'name')
      .populate('convertedToDealId', 'dealId clientName')
      .sort({ createdAt: -1 });

    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get opportunity by ID
router.get('/:id', authenticate, authorize('Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
      .populate('salesExecutiveId', 'name email')
      .populate('salesManagerId', 'name email')
      .populate('qualifiedBy', 'name')
      .populate('sentToDeliveryBy', 'name')
      .populate('convertedToDealId', 'dealId clientName');

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // All roles (Operations Manager, Finance Manager, Business Head, Sales Executive, Sales Manager) can see all opportunities
    // No restriction needed - all opportunities are visible to all authorized roles

    res.json(opportunity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create opportunity (Sales Executive and Sales Manager)
router.post('/', authenticate, authorize('Sales Executive', 'Sales Manager'), async (req, res) => {
  try {
    const opportunityId = await generateOpportunityId(Opportunity);
    
    // Set the correct field based on user role
    const opportunityData = {
      ...req.body,
      opportunityId,
      createdBy: req.user._id,
      opportunityStatus: 'New'
    };
    
    // Sales Executive sets salesExecutiveId, Sales Manager sets salesManagerId
    if (req.user.role === 'Sales Executive') {
      opportunityData.salesExecutiveId = req.user._id;
    } else if (req.user.role === 'Sales Manager') {
      opportunityData.salesManagerId = req.user._id;
    }
    
    const opportunity = new Opportunity(opportunityData);
    await opportunity.save();

    await AuditTrail.create({
      action: 'Opportunity Created',
      entityType: 'Opportunity',
      entityId: opportunity._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: req.body
    });

    // Create notification for relevant roles
    const { createNotification } = await import('../utils/notificationService.js');
    await createNotification(
      'opportunity_created',
      'Opportunity',
      opportunity._id,
      req.user._id,
      { adhocId: opportunity.opportunityId }
    );

    res.status(201).json(opportunity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update opportunity (Sales Executive for their own, Sales Manager for all)
router.put('/:id', authenticate, authorize('Sales Executive', 'Sales Manager'), async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // Sales Executive can only update their own opportunities
    if (req.user.role === 'Sales Executive') {
      const isOwner = (opportunity.salesExecutiveId && opportunity.salesExecutiveId.toString() === req.user._id.toString()) ||
                      (opportunity.createdBy && opportunity.createdBy.toString() === req.user._id.toString());
      if (!isOwner) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Prevent status changes that require approval
    if (req.body.opportunityStatus && req.body.opportunityStatus !== opportunity.opportunityStatus) {
      const isSalesManager = req.user.role === 'Sales Manager';
      if (req.body.opportunityStatus === 'Qualified' && !isSalesManager) {
        return res.status(403).json({ error: 'Only Sales Manager can qualify opportunities' });
      }
      if (req.body.opportunityStatus === 'Sent to Delivery' && !isSalesManager) {
        return res.status(403).json({ error: 'Only Sales Manager can send opportunities to delivery' });
      }
    }

    // Update status timestamps
    const oldStatus = opportunity.opportunityStatus;
    if (req.body.opportunityStatus === 'Qualified' && opportunity.opportunityStatus !== 'Qualified') {
      req.body.qualifiedAt = new Date();
      req.body.qualifiedBy = req.user._id;
    }
    if (req.body.opportunityStatus === 'Sent to Delivery' && opportunity.opportunityStatus !== 'Sent to Delivery') {
      req.body.sentToDeliveryAt = new Date();
      req.body.sentToDeliveryBy = req.user._id;
    }
    if (req.body.opportunityStatus === 'Converted to Deal' && opportunity.opportunityStatus !== 'Converted to Deal') {
      req.body.convertedAt = new Date();
    }
    if (req.body.opportunityStatus === 'Lost' && opportunity.opportunityStatus !== 'Lost') {
      req.body.lostAt = new Date();
    }

    const updatedOpportunity = await Opportunity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    await AuditTrail.create({
      action: 'Opportunity Updated',
      entityType: 'Opportunity',
      entityId: opportunity._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: req.body
    });

    // Create notification for status changes
    if (oldStatus !== req.body.opportunityStatus && req.body.opportunityStatus) {
      const { createNotification } = await import('../utils/notificationService.js');
      let notificationType = null;
      
      if (req.body.opportunityStatus === 'Qualified') {
        notificationType = 'opportunity_qualified';
      } else if (req.body.opportunityStatus === 'Converted to Deal') {
        notificationType = 'opportunity_converted';
      }
      
      if (notificationType) {
        await createNotification(
          notificationType,
          'Opportunity',
          updatedOpportunity._id,
          req.user._id,
          { adhocId: updatedOpportunity.opportunityId }
        );
      }
    }

    res.json(updatedOpportunity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send opportunity to delivery (Sales Manager only)
router.put('/:id/send-to-delivery', authenticate, authorize('Sales Manager'), async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    if (opportunity.opportunityStatus !== 'Qualified') {
      return res.status(400).json({ error: 'Opportunity must be Qualified before sending to delivery' });
    }

    opportunity.opportunityStatus = 'Sent to Delivery';
    opportunity.sentToDeliveryAt = new Date();
    opportunity.sentToDeliveryBy = req.user._id;
    await opportunity.save();

    await AuditTrail.create({
      action: 'Opportunity Sent to Delivery',
      entityType: 'Opportunity',
      entityId: opportunity._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: { status: 'Sent to Delivery' }
    });

    // Create notification
    const { createNotification } = await import('../utils/notificationService.js');
    await createNotification(
      'opportunity_sent_to_delivery',
      'Opportunity',
      opportunity._id,
      req.user._id,
      { adhocId: opportunity.opportunityId }
    );

    res.json(opportunity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get opportunities sent to delivery (Operations Manager)
router.get('/for-delivery', authenticate, authorize('Operations Manager'), async (req, res) => {
  try {
    const opportunities = await Opportunity.find({
      opportunityStatus: 'Sent to Delivery'
    })
      .populate('salesExecutiveId', 'name email')
      .populate('salesManagerId', 'name email')
      .sort({ sentToDeliveryAt: -1 });

    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark opportunity as lost (Sales Manager only)
router.put('/:id/lost', authenticate, authorize('Sales Manager'), async (req, res) => {
  try {
    const { lostReason } = req.body;
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    opportunity.opportunityStatus = 'Lost';
    opportunity.lostReason = lostReason || '';
    opportunity.lostAt = new Date();
    await opportunity.save();

    await AuditTrail.create({
      action: 'Opportunity Marked as Lost',
      entityType: 'Opportunity',
      entityId: opportunity._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: { status: 'Lost', lostReason }
    });

    // Create notification
    const { createNotification } = await import('../utils/notificationService.js');
    await createNotification(
      'opportunity_lost',
      'Opportunity',
      opportunity._id,
      req.user._id,
      { adhocId: opportunity.opportunityId }
    );

    res.json(opportunity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download Opportunity PDF (must be before /:id route)
router.get('/:id/download', authenticate, authorize('Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
      .populate('salesExecutiveId', 'name email')
      .populate('salesManagerId', 'name email')
      .populate('convertedToDealId', 'dealId');

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // Sales Executive can only download their own opportunities
    if (req.user.role === 'Business Head' && req.user.subRole === 'SalesExecutive' && opportunity.salesExecutiveId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { generateOpportunityPDF } = await import('../utils/pdfGenerator.js');
    const pdfBuffer = await generateOpportunityPDF(opportunity.toObject(), req.user.role);

    const SystemEventLog = (await import('../models/SystemEventLog.js')).default;
    try {
    await SystemEventLog.create({
      eventType: 'Document Downloaded',
      entityType: 'Opportunity',
      entityId: opportunity._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      action: 'Downloaded opportunity summary PDF'
    });
    } catch (logError) {
      // Don't fail PDF generation if logging fails
      console.error('Failed to log download event:', logError.message);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Adhoc-${opportunity.opportunityId || opportunity._id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating opportunity PDF:', error);
    res.status(500).json({ error: error.message || 'Failed to generate PDF' });
  }
});

export default router;
