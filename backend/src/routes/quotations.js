import express from 'express';
import Quotation from '../models/Quotation.js';
import Client from '../models/Client.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { generateQuotationNumber } from '../utils/generators.js';
import { AuditTrail } from '../models/Governance.js';

const router = express.Router();

// Get all quotations
router.get('/', authenticate, authorize('Operations Manager', 'Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Finance Manager'), async (req, res) => {
  try {
    const userRole = req.user.role;
    let filter = {};

    // Sales Executive sees only quotations they created or were sent to them
    if (userRole === 'Sales Executive') {
      filter.$or = [
        { createdBy: req.user._id },
        { sentToSalesTeam: true }
      ];
    }

    const quotations = await Quotation.find(filter)
      .populate('clientId', 'clientName trainingSector')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(quotations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single quotation
router.get('/:id', authenticate, authorize('Operations Manager', 'Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Finance Manager'), async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('clientId', 'clientName trainingSector contactPersonName emailId location')
      .populate('createdBy', 'name email');

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create quotation (Operations Manager)
router.post('/', authenticate, authorize('Operations Manager'), async (req, res) => {
  try {
    const quotationNumber = await generateQuotationNumber(Quotation);
    
    const quotation = new Quotation({
      ...req.body,
      quotationNumber,
      createdBy: req.user._id
    });
    await quotation.save();

    await AuditTrail.create({
      action: 'Quotation Created',
      entityType: 'Quotation',
      entityId: quotation._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: req.body
    });

    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update quotation
router.put('/:id', authenticate, authorize('Operations Manager'), async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    Object.assign(quotation, req.body);
    await quotation.save();

    await AuditTrail.create({
      action: 'Quotation Updated',
      entityType: 'Quotation',
      entityId: quotation._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: req.body
    });

    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send quotation to Sales Team
router.post('/:id/send-to-sales', authenticate, authorize('Operations Manager'), async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    quotation.sentToSalesTeam = true;
    quotation.sentToSalesTeamAt = new Date();
    quotation.status = 'Sent to Client';
    await quotation.save();

    await AuditTrail.create({
      action: 'Quotation Sent to Sales Team',
      entityType: 'Quotation',
      entityId: quotation._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: { sentToSalesTeam: true }
    });

    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
