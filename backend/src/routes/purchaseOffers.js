import express from 'express';
import PurchaseOffer from '../models/PurchaseOffer.js';
import Quotation from '../models/Quotation.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { generatePurchaseOfferNumber } from '../utils/generators.js';
import { AuditTrail } from '../models/Governance.js';

const router = express.Router();

// Get all purchase offers
router.get('/', authenticate, authorize('Sales Executive', 'Sales Manager', 'Operations Manager', 'Business Head', 'Director', 'Finance Manager'), async (req, res) => {
  try {
    const purchaseOffers = await PurchaseOffer.find({})
      .populate('quotationId', 'quotationNumber clientName totalValue')
      .populate('clientId', 'clientName trainingSector')
      .populate('receivedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(purchaseOffers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single purchase offer
router.get('/:id', authenticate, authorize('Sales Executive', 'Sales Manager', 'Operations Manager', 'Business Head', 'Director', 'Finance Manager'), async (req, res) => {
  try {
    const purchaseOffer = await PurchaseOffer.findById(req.params.id)
      .populate('quotationId', 'quotationNumber clientName totalValue serviceDescription')
      .populate('clientId', 'clientName trainingSector contactPersonName emailId')
      .populate('receivedBy', 'name email');

    if (!purchaseOffer) {
      return res.status(404).json({ error: 'Purchase Offer not found' });
    }

    res.json(purchaseOffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create purchase offer (Sales Executive or Sales Manager)
router.post('/', authenticate, authorize('Sales Executive', 'Sales Manager'), async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.body.quotationId);
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const offerNumber = await generatePurchaseOfferNumber(PurchaseOffer);
    
    const purchaseOffer = new PurchaseOffer({
      ...req.body,
      offerNumber,
      receivedBy: req.user._id,
      clientId: quotation.clientId,
      clientName: quotation.clientName
    });
    await purchaseOffer.save();

    await AuditTrail.create({
      action: 'Purchase Offer Created',
      entityType: 'PurchaseOffer',
      entityId: purchaseOffer._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: req.body
    });

    res.status(201).json(purchaseOffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update purchase offer
router.put('/:id', authenticate, authorize('Sales Executive', 'Sales Manager'), async (req, res) => {
  try {
    const purchaseOffer = await PurchaseOffer.findById(req.params.id);
    
    if (!purchaseOffer) {
      return res.status(404).json({ error: 'Purchase Offer not found' });
    }

    Object.assign(purchaseOffer, req.body);
    await purchaseOffer.save();

    await AuditTrail.create({
      action: 'Purchase Offer Updated',
      entityType: 'PurchaseOffer',
      entityId: purchaseOffer._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: req.body
    });

    res.json(purchaseOffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Convert purchase offer to BOC
router.post('/:id/convert-to-boc', authenticate, authorize('Sales Executive', 'Sales Manager'), async (req, res) => {
  try {
    const purchaseOffer = await PurchaseOffer.findById(req.params.id);
    if (!purchaseOffer) {
      return res.status(404).json({ error: 'Purchase Offer not found' });
    }

    if (purchaseOffer.convertedToBOC) {
      return res.status(400).json({ error: 'Purchase Offer already converted to BOC' });
    }

    const BOC = (await import('../models/BOC.js')).default;
    const { generateBOCNumber } = await import('../utils/generators.js');
    
    const bocNumber = await generateBOCNumber(BOC);
    
    const boc = new BOC({
      bocNumber,
      purchaseOfferId: purchaseOffer._id,
      quotationId: purchaseOffer.quotationId,
      clientId: purchaseOffer.clientId,
      clientName: purchaseOffer.clientName,
      confirmedValue: purchaseOffer.offerValue,
      createdBy: req.user._id,
      status: 'Draft'
    });
    await boc.save();

    purchaseOffer.convertedToBOC = true;
    purchaseOffer.bocId = boc._id;
    purchaseOffer.status = 'Accepted';
    await purchaseOffer.save();

    await AuditTrail.create({
      action: 'Purchase Offer Converted to BOC',
      entityType: 'PurchaseOffer',
      entityId: purchaseOffer._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: { bocId: boc._id.toString() }
    });

    res.status(201).json(boc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
